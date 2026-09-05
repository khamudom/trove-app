import { beforeEach, describe, expect, it } from 'vitest'
import {
  LocalRepository,
  clearLocalStore,
  getRecentBinIds,
  trackRecentBin,
  GUEST_BIN_LIMIT_MESSAGE,
} from '@/repositories/localRepository'
import { getQrUrl } from '@/lib/utils'

describe('LocalRepository', () => {
  beforeEach(() => {
    clearLocalStore()
    localStorage.clear()
  })

  it('creates and edits bins', async () => {
    const repo = new LocalRepository()
    const bin = await repo.createBin({ name: 'Garage Box', location: 'Garage' })
    expect(bin.name).toBe('Garage Box')

    const updated = await repo.updateBin(bin.id, { location: 'Garage Shelf 2' })
    expect(updated.location).toBe('Garage Shelf 2')
  })

  it('adds multiple items to a bin', async () => {
    const repo = new LocalRepository()
    const bin = await repo.createBin({ name: 'Toolbox' })
    await repo.createItem({ binId: bin.id, name: 'Hammer' })
    await repo.createItem({ binId: bin.id, name: 'Tape measure' })
    const items = await repo.listItems(bin.id)
    expect(items).toHaveLength(2)
  })

  it('moves an item to another bin', async () => {
    const repo = new LocalRepository()
    const timestamp = '2026-01-01T00:00:00.000Z'
    await repo.importSnapshot({
      bins: [
        { id: 'bin-1', name: 'Toolbox', tags: [], createdAt: timestamp, updatedAt: timestamp },
        { id: 'bin-2', name: 'Garage Shelf', tags: [], createdAt: timestamp, updatedAt: timestamp },
      ],
      items: [
        {
          id: 'item-1',
          binId: 'bin-1',
          name: 'Cordless drill',
          tags: [],
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      exportedAt: timestamp,
    })

    const moved = await repo.moveItem('item-1', 'bin-2')

    expect(moved.binId).toBe('bin-2')
    expect(await repo.listItems('bin-1')).toEqual([])
    expect(await repo.listItems('bin-2')).toEqual([moved])
  })

  it('searches items and navigates by bin id', async () => {
    const repo = new LocalRepository()
    const bin = await repo.createBin({ name: 'Toolbox' })
    await repo.createItem({ binId: bin.id, name: 'Hammer' })
    const results = await repo.search('hammer')
    expect(results.some((result) => result.title === 'Hammer')).toBe(true)
    const match = results.find((result) => result.title === 'Hammer')
    expect(match?.binId).toBe(bin.id)
  })

  it('starts with no bins or items', async () => {
    const repo = new LocalRepository()
    expect(await repo.listBins()).toEqual([])
    expect(await repo.search('hammer')).toEqual([])
  })

  it('does not expose qr tokens for local bins', async () => {
    const repo = new LocalRepository()
    const bin = await repo.createBin({ name: 'Local Only' })
    expect(bin.qrToken).toBeUndefined()
  })

  it('limits guests to one bin', async () => {
    const repo = new LocalRepository()
    await repo.createBin({ name: 'First' })
    await expect(repo.createBin({ name: 'Second' })).rejects.toThrow(GUEST_BIN_LIMIT_MESSAGE)
    expect(await repo.listBins()).toHaveLength(1)
  })

  it('allows a new bin after the guest deletes their only bin', async () => {
    const repo = new LocalRepository()
    const first = await repo.createBin({ name: 'First' })
    await repo.deleteBin(first.id)
    const second = await repo.createBin({ name: 'Second' })
    expect(second.name).toBe('Second')
  })

  it('keeps guest data in memory only — not localStorage', async () => {
    const repo = new LocalRepository()
    await repo.createBin({ name: 'Ephemeral' })
    expect(localStorage.getItem('trove-local-data-v2')).toBeNull()
    expect(localStorage.getItem('trove-local-data')).toBeNull()
  })

  it('shares in-memory state across repository instances', async () => {
    const a = new LocalRepository()
    const b = new LocalRepository()
    await a.createBin({ name: 'Shared' })
    expect(await b.listBins()).toHaveLength(1)
  })

  it('tracks recent bins in memory only', () => {
    trackRecentBin('bin-a')
    trackRecentBin('bin-b')
    expect(getRecentBinIds()).toEqual(['bin-b', 'bin-a'])
    expect(localStorage.getItem('trove-recent-bins')).toBeNull()
  })
})

describe('QR URLs', () => {
  it('generates public token routes', () => {
    expect(getQrUrl('abc123token')).toBe(`${window.location.origin}/b/abc123token`)
  })
})
