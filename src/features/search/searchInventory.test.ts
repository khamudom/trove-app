import { describe, expect, it } from 'vitest'
import type { Bin, Item } from '@/types'
import { searchInventory } from './searchInventory'

const bin: Bin = {
  id: 'bin-2',
  name: 'Bin2',
  location: 'Garage',
  tags: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const items: Item[] = [
  {
    id: 'bow-ties',
    binId: bin.id,
    name: 'Bow ties',
    tags: ['formal wear'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'socks',
    binId: bin.id,
    name: 'Socks',
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

describe('searchInventory', () => {
  it('finds an item from a natural-language question', () => {
    const results = searchInventory([bin], items, 'Where is my bow ties?')

    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      type: 'item',
      title: 'Bow ties',
      subtitle: 'Bin2',
      location: 'Garage',
    })
  })

  it('searches tags without requiring search-command words to match', () => {
    const results = searchInventory([bin], items, 'please find my formal wear')

    expect(results.map((result) => result.title)).toEqual(['Bow ties'])
  })

  it('ranks an exact name above a tag match', () => {
    const taggedItem: Item = { ...items[1], id: 'tagged', tags: ['bow ties'] }
    const results = searchInventory([bin], [...items, taggedItem], 'bow ties')

    expect(results.map((result) => result.title)).toEqual(['Bow ties', 'Socks'])
  })

  it('returns no results for an empty query', () => {
    expect(searchInventory([bin], items, '   ')).toEqual([])
  })
})
