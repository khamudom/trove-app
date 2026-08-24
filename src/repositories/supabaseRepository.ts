import { getSupabaseClient } from '@/lib/supabase'
import { createId, normalizeText, nowIso } from '@/lib/utils'
import type {
  Bin,
  BinWithItems,
  CreateBinInput,
  CreateItemInput,
  ImportResult,
  Item,
  LocalSnapshot,
  PublicBin,
  SearchResult,
  UpdateBinInput,
  UpdateItemInput,
} from '@/types'
import type { PublicBinReader, TroveRepository } from './types'

type BinRow = {
  id: string
  user_id: string
  qr_token: string
  name: string
  description: string | null
  category: string | null
  tags: string[]
  location: string | null
  preview_image: string | null
  created_at: string
  updated_at: string
}

type ItemRow = {
  id: string
  user_id: string
  bin_id: string
  name: string
  description: string | null
  image: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

function mapBin(row: BinRow): Bin {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    category: row.category ?? undefined,
    tags: row.tags ?? [],
    location: row.location ?? undefined,
    previewImage: row.preview_image ?? undefined,
    qrToken: row.qr_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    binId: row.bin_id,
    name: row.name,
    description: row.description ?? undefined,
    image: row.image ?? undefined,
    tags: row.tags ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function searchRows(bins: Bin[], items: Item[], query: string): SearchResult[] {
  const q = normalizeText(query)
  if (!q) return []
  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const item of items) {
    const bin = bins.find((b) => b.id === item.binId)
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

  for (const bin of bins) {
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

export class SupabaseRepository implements TroveRepository {
  private client = getSupabaseClient()

  private requireClient() {
    if (!this.client) throw new Error('Supabase is not configured')
    return this.client
  }

  async listBins(): Promise<Bin[]> {
    const { data, error } = await this.requireClient()
      .from('bins')
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data as BinRow[]).map(mapBin)
  }

  async getBin(id: string): Promise<Bin | null> {
    const { data, error } = await this.requireClient().from('bins').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? mapBin(data as BinRow) : null
  }

  async getBinWithItems(id: string): Promise<BinWithItems | null> {
    const bin = await this.getBin(id)
    if (!bin) return null
    const items = await this.listItems(id)
    return { ...bin, items }
  }

  async createBin(input: CreateBinInput): Promise<Bin> {
    const user = (await this.requireClient().auth.getUser()).data.user
    if (!user) throw new Error('Not authenticated')
    const payload = {
      user_id: user.id,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      category: input.category?.trim() || null,
      tags: input.tags ?? [],
      location: input.location?.trim() || null,
      preview_image: input.previewImage ?? null,
    }
    const { data, error } = await this.requireClient().from('bins').insert(payload).select('*').single()
    if (error) throw error
    return mapBin(data as BinRow)
  }

  async updateBin(id: string, input: UpdateBinInput): Promise<Bin> {
    const payload: Record<string, unknown> = { updated_at: nowIso() }
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.description !== undefined) payload.description = input.description.trim() || null
    if (input.category !== undefined) payload.category = input.category.trim() || null
    if (input.tags !== undefined) payload.tags = input.tags
    if (input.location !== undefined) payload.location = input.location.trim() || null
    if (input.previewImage !== undefined) payload.preview_image = input.previewImage ?? null

    const { data, error } = await this.requireClient().from('bins').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return mapBin(data as BinRow)
  }

  async deleteBin(id: string): Promise<void> {
    const { error } = await this.requireClient().from('bins').delete().eq('id', id)
    if (error) throw error
  }

  async listItems(binId: string): Promise<Item[]> {
    const { data, error } = await this.requireClient()
      .from('items')
      .select('*')
      .eq('bin_id', binId)
      .order('name')
    if (error) throw error
    return (data as ItemRow[]).map(mapItem)
  }

  async createItem(input: CreateItemInput): Promise<Item> {
    const user = (await this.requireClient().auth.getUser()).data.user
    if (!user) throw new Error('Not authenticated')
    const payload = {
      user_id: user.id,
      bin_id: input.binId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      image: input.image ?? null,
      tags: input.tags ?? [],
    }
    const { data, error } = await this.requireClient().from('items').insert(payload).select('*').single()
    if (error) throw error
    await this.requireClient().from('bins').update({ updated_at: nowIso() }).eq('id', input.binId)
    return mapItem(data as ItemRow)
  }

  async updateItem(id: string, input: UpdateItemInput): Promise<Item> {
    const payload: Record<string, unknown> = { updated_at: nowIso() }
    if (input.name !== undefined) payload.name = input.name.trim()
    if (input.description !== undefined) payload.description = input.description.trim() || null
    if (input.image !== undefined) payload.image = input.image ?? null
    if (input.tags !== undefined) payload.tags = input.tags

    const { data, error } = await this.requireClient().from('items').update(payload).eq('id', id).select('*').single()
    if (error) throw error
    return mapItem(data as ItemRow)
  }

  async deleteItem(id: string): Promise<void> {
    const { error } = await this.requireClient().from('items').delete().eq('id', id)
    if (error) throw error
  }

  async search(query: string): Promise<SearchResult[]> {
    const bins = await this.listBins()
    const client = this.requireClient()
    const { data, error } = await client.from('items').select('*')
    if (error) throw error
    return searchRows(bins, (data as ItemRow[]).map(mapItem), query)
  }

  async exportSnapshot(): Promise<LocalSnapshot> {
    const bins = await this.listBins()
    const client = this.requireClient()
    const { data, error } = await client.from('items').select('*')
    if (error) throw error
    return {
      bins,
      items: (data as ItemRow[]).map(mapItem),
      exportedAt: nowIso(),
    }
  }

  async importSnapshot(snapshot: LocalSnapshot): Promise<ImportResult> {
    const user = (await this.requireClient().auth.getUser()).data.user
    if (!user) throw new Error('Not authenticated')

    const idMap: Record<string, string> = {}
    const importedBins: Bin[] = []
    const importedItems: Item[] = []

    for (const localBin of snapshot.bins) {
      const newId = createId()
      idMap[localBin.id] = newId
      const { data, error } = await this.requireClient()
        .from('bins')
        .insert({
          id: newId,
          user_id: user.id,
          name: localBin.name,
          description: localBin.description ?? null,
          category: localBin.category ?? null,
          tags: localBin.tags,
          location: localBin.location ?? null,
          preview_image: localBin.previewImage ?? null,
        })
        .select('*')
        .single()
      if (error) throw error
      importedBins.push(mapBin(data as BinRow))
    }

    for (const localItem of snapshot.items) {
      const binId = idMap[localItem.binId]
      if (!binId) continue
      const { data, error } = await this.requireClient()
        .from('items')
        .insert({
          user_id: user.id,
          bin_id: binId,
          name: localItem.name,
          description: localItem.description ?? null,
          image: localItem.image ?? null,
          tags: localItem.tags,
        })
        .select('*')
        .single()
      if (error) throw error
      importedItems.push(mapItem(data as ItemRow))
    }

    return { idMap, bins: importedBins, items: importedItems }
  }
}

export class SupabasePublicBinReader implements PublicBinReader {
  async getByQrToken(token: string): Promise<PublicBin | null> {
    const client = getSupabaseClient()
    if (!client) return null

    const { data, error } = await client.rpc('get_public_bin_by_qr_token', { p_token: token })
    if (error || !data) return null

    const row = data as {
      name: string
      description: string | null
      category: string | null
      tags: string[]
      location: string | null
      preview_image: string | null
      items: Array<{ name: string; description: string | null; image: string | null; tags: string[] }>
    }

    return {
      name: row.name,
      description: row.description ?? undefined,
      category: row.category ?? undefined,
      tags: row.tags ?? [],
      location: row.location ?? undefined,
      previewImage: row.preview_image ?? undefined,
      items: (row.items ?? []).map((item) => ({
        name: item.name,
        description: item.description ?? undefined,
        image: item.image ?? undefined,
        tags: item.tags ?? [],
      })),
    }
  }
}
