import { describe, expect, it } from 'vitest'
import { normalizeText } from '@/lib/utils'
import type { Bin } from '@/types'

function resolveBinsByName(bins: Bin[], binName: string) {
  const target = normalizeText(binName)
  return bins.filter((bin) => normalizeText(bin.name).includes(target))
}

describe('voice bin resolution', () => {
  const bins: Bin[] = [
    { id: '1', name: 'Garage Toolbox', tags: [], createdAt: '', updatedAt: '' },
    { id: '2', name: 'Workshop Toolbox', tags: [], createdAt: '', updatedAt: '' },
  ]

  it('detects ambiguous bin matches', () => {
    expect(resolveBinsByName(bins, 'toolbox')).toHaveLength(2)
  })

  it('resolves a unique bin match', () => {
    expect(resolveBinsByName(bins, 'garage toolbox')).toHaveLength(1)
  })
})
