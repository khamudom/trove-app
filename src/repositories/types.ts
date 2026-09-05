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

export interface TroveRepository {
  listBins(): Promise<Bin[]>
  getBin(id: string): Promise<Bin | null>
  getBinWithItems(id: string): Promise<BinWithItems | null>
  createBin(input: CreateBinInput): Promise<Bin>
  updateBin(id: string, input: UpdateBinInput): Promise<Bin>
  deleteBin(id: string): Promise<void>
  listItems(binId: string): Promise<Item[]>
  createItem(input: CreateItemInput): Promise<Item>
  updateItem(id: string, input: UpdateItemInput): Promise<Item>
  moveItem(id: string, binId: string): Promise<Item>
  deleteItem(id: string): Promise<void>
  search(query: string): Promise<SearchResult[]>
  exportSnapshot(): Promise<LocalSnapshot>
  importSnapshot(snapshot: LocalSnapshot): Promise<ImportResult>
}

export interface PublicBinReader {
  getByQrToken(token: string): Promise<import('@/types').PublicBin | null>
}
