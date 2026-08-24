export interface Bin {
  id: string
  name: string
  description?: string
  category?: string
  tags: string[]
  location?: string
  previewImage?: string
  qrToken?: string
  createdAt: string
  updatedAt: string
}

export interface Item {
  id: string
  binId: string
  name: string
  description?: string
  image?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface BinWithItems extends Bin {
  items: Item[]
}

export interface PublicBin {
  name: string
  description?: string
  category?: string
  tags: string[]
  location?: string
  previewImage?: string
  items: Array<{
    name: string
    description?: string
    image?: string
    tags: string[]
  }>
}

export interface SearchResult {
  type: 'item' | 'bin'
  itemId?: string
  binId: string
  title: string
  subtitle: string
  location?: string
  matchField: string
}

export interface LocalSnapshot {
  bins: Bin[]
  items: Item[]
  exportedAt: string
}

export interface ImportResult {
  idMap: Record<string, string>
  bins: Bin[]
  items: Item[]
}

export interface CreateBinInput {
  name: string
  description?: string
  category?: string
  tags?: string[]
  location?: string
  previewImage?: string
}

export interface UpdateBinInput extends Partial<CreateBinInput> {}

export interface CreateItemInput {
  binId: string
  name: string
  description?: string
  image?: string
  tags?: string[]
}

export interface UpdateItemInput extends Partial<Omit<CreateItemInput, 'binId'>> {}
