import { beforeEach, describe, expect, it } from 'vitest'
import { LocalRepository, clearLocalStore } from '@/repositories/localRepository'
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
})

describe('QR URLs', () => {
  it('generates public token routes', () => {
    expect(getQrUrl('abc123token')).toBe(`${window.location.origin}/b/abc123token`)
  })
})
