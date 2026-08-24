import { LocalRepository } from './localRepository'
import { SupabasePublicBinReader, SupabaseRepository } from './supabaseRepository'
import type { PublicBinReader, TroveRepository } from './types'

export function createLocalRepository(): TroveRepository {
  return new LocalRepository()
}

export function createSupabaseRepository(): TroveRepository {
  return new SupabaseRepository()
}

export function createPublicBinReader(): PublicBinReader {
  return new SupabasePublicBinReader()
}

export async function migrateLocalToAccount(localRepo: TroveRepository, supabaseRepo: TroveRepository) {
  const snapshot = await localRepo.exportSnapshot()
  if (snapshot.bins.length === 0) return { idMap: {}, bins: [], items: [] }
  return supabaseRepo.importSnapshot(snapshot)
}
