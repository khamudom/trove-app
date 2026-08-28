import { describe, expect, it } from 'vitest'
import type { Bin, Item } from '@/types'
import {
  archiveBadge,
  buildSignedInHomeModel,
  firstNameFromIdentity,
  greetingPeriod,
} from './signedInHomeModel'

function bin(overrides: Partial<Bin> & Pick<Bin, 'id' | 'name'>): Bin {
  return {
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  }
}

function item(overrides: Partial<Item> & Pick<Item, 'id' | 'binId' | 'name'>): Item {
  return {
    tags: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('signedInHomeModel', () => {
  it('derives a first name from display name or email', () => {
    expect(firstNameFromIdentity('Sam Wilson', 'other@example.com')).toBe('Sam')
    expect(firstNameFromIdentity(undefined, 'sam.jones@example.com')).toBe('Sam')
    expect(firstNameFromIdentity(undefined, undefined)).toBeNull()
  })

  it('greets by time of day', () => {
    expect(greetingPeriod(new Date('2026-08-27T08:00:00'))).toBe('morning')
    expect(greetingPeriod(new Date('2026-08-27T15:00:00'))).toBe('afternoon')
    expect(greetingPeriod(new Date('2026-08-27T19:00:00'))).toBe('evening')
  })

  it('builds a dashboard from the signed-in inventory', () => {
    const bins = [
      bin({ id: 'bin-2', name: 'Bin2', location: 'Garage', updatedAt: '2026-08-20T00:00:00.000Z' }),
      bin({
        id: 'camera',
        name: 'Camera Gear',
        location: 'Hall closet',
        category: 'Camera Gear',
      }),
      bin({ id: 'camp', name: 'Camping', location: 'Garage', tags: ['camp'] }),
    ]
    const items = [
      item({
        id: 'sx70',
        binId: 'camera',
        name: 'Polaroid SX-70',
        updatedAt: '2025-06-27T00:00:00.000Z',
      }),
      item({
        id: 'stove',
        binId: 'camp',
        name: 'camping stove',
        createdAt: '2026-08-10T00:00:00.000Z',
        updatedAt: '2026-08-10T00:00:00.000Z',
      }),
      item({
        id: 'ladder',
        binId: 'bin-2',
        name: 'Ladder',
        description: 'Lent to Marcus',
        tags: ['lent'],
        updatedAt: '2026-08-06T00:00:00.000Z',
      }),
    ]

    const model = buildSignedInHomeModel({
      bins,
      items,
      recentBins: bins,
      displayName: 'Sam',
      email: 'sam@example.com',
      now: new Date('2026-08-27T19:15:00'),
    })

    expect(model.firstName).toBe('Sam')
    expect(model.period).toBe('evening')
    expect(model.itemCount).toBe(3)
    expect(model.binCount).toBe(3)
    expect(model.searchExample).toBe('camping stove')
    expect(model.archive?.item.name).toBe('Polaroid SX-70')
    expect(model.archive?.badge).toBe('UNTOUCHED FOR 14 MONTHS')
    expect(model.archive?.bin.name).toBe('Camera Gear')
    expect(model.insight?.title).toBe('Camping season winds down')
    expect(model.insight?.body).toContain('1 bin')
    expect(model.looseEnds[0]?.title).toBe('Ladder lent to Marcus')
    expect(model.looseEnds.some((entry) => entry.title === 'Bin2 has 1 item')).toBe(true)
    expect(model.recentBins).toHaveLength(3)
    expect(model.addedThisMonth).toBe(1)
    expect(model.untouchedCount).toBe(1)
  })

  it('hides archive and seasonal cards when the inventory does not support them', () => {
    const bins = [bin({ id: 'tools', name: 'Toolbox', location: 'Garage' })]
    const items = [
      item({
        id: 'hammer',
        binId: 'tools',
        name: 'Hammer',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-20T00:00:00.000Z',
      }),
    ]

    const model = buildSignedInHomeModel({
      bins,
      items,
      recentBins: bins,
      email: 'you@example.com',
      now: new Date('2026-08-27T10:00:00'),
    })

    expect(model.archive).toBeNull()
    expect(model.insight).toBeNull()
    expect(model.searchExample).toBe('Hammer')
    expect(model.untouchedCount).toBe(0)
  })

  it('formats untouched badges in whole months', () => {
    expect(archiveBadge('2026-07-27T00:00:00.000Z', Date.parse('2026-08-27T00:00:00.000Z'))).toBe(
      'UNTOUCHED FOR 1 MONTH',
    )
    expect(archiveBadge('2026-08-20T00:00:00.000Z', Date.parse('2026-08-27T00:00:00.000Z'))).toBeNull()
  })
})
