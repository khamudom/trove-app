import { searchInventory } from '@/features/search/searchInventory'
import { createId, nowIso } from '@/lib/utils'
import { GUEST_BIN_LIMIT_MESSAGE } from '@/features/auth/guestBinLimit'
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

/** Legacy keys from older builds that persisted guest data. Cleared on load. */
const LEGACY_STORAGE_KEY = 'trove-local-data'
const LEGACY_STORAGE_KEY_V2 = 'trove-local-data-v2'
const LEGACY_RECENT_KEY = 'trove-recent-bins'

export { GUEST_BIN_LIMIT_MESSAGE }

interface Store {
  bins: Bin[]
  items: Item[]
}

function emptyStore(): Store {
  return { bins: [], items: [] }
}

/** Guest inventory lives in memory only — closing the app clears everything. */
let memoryStore: Store = emptyStore()
let recentBinIds: string[] = []

function purgeLegacyLocalStorage(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(LEGACY_STORAGE_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY_V2)
  localStorage.removeItem(LEGACY_RECENT_KEY)
}

purgeLegacyLocalStorage()

export class LocalRepository implements TroveRepository {
  private getStore(): Store {
    return memoryStore
  }

  private saveStore(store: Store): void {
    memoryStore = store
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
    if (store.bins.length >= 1) {
      throw new Error(GUEST_BIN_LIMIT_MESSAGE)
    }
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
    const next = { bins: [bin, ...store.bins], items: [...store.items] }
    this.saveStore(next)
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
    const bins = [...store.bins]
    bins[index] = updated
    this.saveStore({ bins, items: store.items })
    return updated
  }

  async deleteBin(id: string): Promise<void> {
    const store = this.getStore()
    this.saveStore({
      bins: store.bins.filter((b) => b.id !== id),
      items: store.items.filter((i) => i.binId !== id),
    })
    recentBinIds = recentBinIds.filter((entry) => entry !== id)
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
    const bins = store.bins.map((bin) =>
      bin.id === input.binId ? { ...bin, updatedAt: now } : bin,
    )
    this.saveStore({ bins, items: [...store.items, item] })
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
    const items = [...store.items]
    items[index] = updated
    this.saveStore({ bins: store.bins, items })
    return updated
  }

  async deleteItem(id: string): Promise<void> {
    const store = this.getStore()
    this.saveStore({
      bins: store.bins,
      items: store.items.filter((i) => i.id !== id),
    })
  }

  async search(query: string): Promise<SearchResult[]> {
    const store = this.getStore()
    return searchInventory(store.bins, store.items, query)
  }

  async exportSnapshot(): Promise<LocalSnapshot> {
    const store = this.getStore()
    return { bins: store.bins, items: store.items, exportedAt: nowIso() }
  }

  async importSnapshot(snapshot: LocalSnapshot): Promise<ImportResult> {
    this.saveStore({ bins: snapshot.bins, items: snapshot.items })
    return { idMap: Object.fromEntries(snapshot.bins.map((b) => [b.id, b.id])), bins: snapshot.bins, items: snapshot.items }
  }
}

export function getRecentBinIds(): string[] {
  return [...recentBinIds]
}

export function trackRecentBin(id: string): void {
  recentBinIds = [id, ...recentBinIds.filter((entry) => entry !== id)].slice(0, 8)
}

export function clearLocalStore(): void {
  memoryStore = emptyStore()
  recentBinIds = []
  purgeLegacyLocalStorage()
}
