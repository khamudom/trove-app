import { createId, normalizeText, nowIso } from '@/lib/utils'
import type {
  Bin,
  BinWithItems,
  CreateBinInput,
  CreateItemInput,
  ImportResult,
  Item,
  LocalSnapshot,
  SearchResult,
  UpdateBinInput,
  UpdateItemInput,
} from '@/types'
import type { TroveRepository } from './types'

const STORAGE_KEY = 'trove-local-data-v2'
const RECENT_KEY = 'trove-recent-bins'
const LEGACY_STORAGE_KEY = 'trove-local-data'

interface Store {
  bins: Bin[]
  items: Item[]
}

function emptyStore(): Store {
  return { bins: [], items: [] }
}

function loadStore(): Store {
  // Drop the previous mock-seeded local store so the app starts empty.
  if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    localStorage.removeItem(RECENT_KEY)
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as Store
    } catch {
      // fall through
    }
  }
  const store = emptyStore()
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  return store
}

function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function searchStore(store: Store, query: string): SearchResult[] {
  const q = normalizeText(query)
  if (!q) return []

  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const item of store.items) {
    const bin = store.bins.find((b) => b.id === item.binId)
    if (!bin) continue
    const fields = [item.name, item.description ?? '', ...item.tags].map(normalizeText)
    if (fields.some((f) => f.includes(q))) {
      const key = `item:${item.id}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          type: 'item',
          itemId: item.id,
          binId: bin.id,
          title: item.name,
          subtitle: bin.name,
          location: bin.location,
          matchField: 'item',
        })
      }
    }
  }

  for (const bin of store.bins) {
    const fields = [bin.name, bin.description ?? '', bin.category ?? '', bin.location ?? '', ...bin.tags].map(normalizeText)
    if (fields.some((f) => f.includes(q))) {
      const key = `bin:${bin.id}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          type: 'bin',
          binId: bin.id,
          title: bin.name,
          subtitle: bin.category ?? 'Bin',
          location: bin.location,
          matchField: 'bin',
        })
      }
    }
  }

  return results
}

export class LocalRepository implements TroveRepository {
  private getStore(): Store {
    return loadStore()
  }

  async listBins(): Promise<Bin[]> {
    return [...this.getStore().bins].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  async getBin(id: string): Promise<Bin | null> {
    return this.getStore().bins.find((b) => b.id === id) ?? null
  }

  async getBinWithItems(id: string): Promise<BinWithItems | null> {
    const store = this.getStore()
    const bin = store.bins.find((b) => b.id === id)
    if (!bin) return null
    return {
      ...bin,
      items: store.items.filter((i) => i.binId === id).sort((a, b) => a.name.localeCompare(b.name)),
    }
  }

  async createBin(input: CreateBinInput): Promise<Bin> {
    const store = this.getStore()
    const now = nowIso()
    const bin: Bin = {
      id: createId(),
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      category: input.category?.trim() || undefined,
      tags: input.tags ?? [],
      location: input.location?.trim() || undefined,
      previewImage: input.previewImage,
      createdAt: now,
      updatedAt: now,
    }
    store.bins.unshift(bin)
    saveStore(store)
    return bin
  }

  async updateBin(id: string, input: UpdateBinInput): Promise<Bin> {
    const store = this.getStore()
    const index = store.bins.findIndex((b) => b.id === id)
    if (index === -1) throw new Error('Bin not found')
    const current = store.bins[index]
    const updated: Bin = {
      ...current,
      ...input,
      name: input.name?.trim() ?? current.name,
      description: input.description !== undefined ? input.description.trim() || undefined : current.description,
      category: input.category !== undefined ? input.category.trim() || undefined : current.category,
      location: input.location !== undefined ? input.location.trim() || undefined : current.location,
      tags: input.tags ?? current.tags,
      updatedAt: nowIso(),
    }
    store.bins[index] = updated
    saveStore(store)
    return updated
  }

  async deleteBin(id: string): Promise<void> {
    const store = this.getStore()
    store.bins = store.bins.filter((b) => b.id !== id)
    store.items = store.items.filter((i) => i.binId !== id)
    saveStore(store)
  }

  async listItems(binId: string): Promise<Item[]> {
    return this.getStore().items.filter((i) => i.binId === binId)
  }

  async createItem(input: CreateItemInput): Promise<Item> {
    const store = this.getStore()
    const now = nowIso()
    const item: Item = {
      id: createId(),
      binId: input.binId,
      name: input.name.trim(),
      description: input.description?.trim() || undefined,
      image: input.image,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    }
    store.items.push(item)
    const binIndex = store.bins.findIndex((b) => b.id === input.binId)
    if (binIndex >= 0) store.bins[binIndex].updatedAt = now
    saveStore(store)
    return item
  }

  async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    const store = this.getStore()
    const index = store.items.findIndex((i) => i.id === id)
    if (index === -1) throw new Error('Item not found')
    const current = store.items[index]
    const updated: Item = {
      ...current,
      ...input,
      name: input.name?.trim() ?? current.name,
      description: input.description !== undefined ? input.description.trim() || undefined : current.description,
      tags: input.tags ?? current.tags,
      updatedAt: nowIso(),
    }
    store.items[index] = updated
    saveStore(store)
    return updated
  }

  async deleteItem(id: string): Promise<void> {
    const store = this.getStore()
    store.items = store.items.filter((i) => i.id !== id)
    saveStore(store)
  }

  async search(query: string): Promise<SearchResult[]> {
    return searchStore(this.getStore(), query)
  }

  async exportSnapshot(): Promise<LocalSnapshot> {
    const store = this.getStore()
    return { bins: store.bins, items: store.items, exportedAt: nowIso() }
  }

  async importSnapshot(snapshot: LocalSnapshot): Promise<ImportResult> {
    saveStore({ bins: snapshot.bins, items: snapshot.items })
    return { idMap: Object.fromEntries(snapshot.bins.map((b) => [b.id, b.id])), bins: snapshot.bins, items: snapshot.items }
  }
}

export function getRecentBinIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function trackRecentBin(id: string): void {
  const recent = getRecentBinIds().filter((entry) => entry !== id)
  recent.unshift(id)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)))
}

export function clearLocalStore(): void {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  localStorage.removeItem(RECENT_KEY)
}
