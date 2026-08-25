import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrateLocalToAccount } from './index'
import { LocalRepository, clearLocalStore } from './localRepository'
import type { TroveRepository } from './types'

describe('migrateLocalToAccount', () => {
  beforeEach(() => {
    clearLocalStore()
  })

  it('imports the guest snapshot then clears the local store', async () => {
    const localRepo = new LocalRepository()
    const bin = await localRepo.createBin({ name: 'Guest bin' })
    await localRepo.createItem({ binId: bin.id, name: 'Hammer' })

    const importSnapshot = vi.fn().mockResolvedValue({
      idMap: { [bin.id]: 'cloud-bin' },
      bins: [],
      items: [],
    })
    const supabaseRepo = { importSnapshot } as unknown as TroveRepository

    await migrateLocalToAccount(localRepo, supabaseRepo)

    expect(importSnapshot).toHaveBeenCalledOnce()
    expect(await localRepo.listBins()).toEqual([])
    expect(await localRepo.listItems(bin.id)).toEqual([])
  })

  it('skips import when the guest store is empty', async () => {
    const localRepo = new LocalRepository()
    const importSnapshot = vi.fn()
    const supabaseRepo = { importSnapshot } as unknown as TroveRepository

    const result = await migrateLocalToAccount(localRepo, supabaseRepo)

    expect(importSnapshot).not.toHaveBeenCalled()
    expect(result).toEqual({ idMap: {}, bins: [], items: [] })
  })
})
