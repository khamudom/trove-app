import { normalizeText } from '@/lib/utils'
import type { Bin, Item, SearchResult } from '@/types'

type SearchableBin = Pick<Bin, 'id' | 'name' | 'description' | 'category' | 'tags' | 'location'>
type SearchableItem = Pick<Item, 'id' | 'binId' | 'name' | 'description' | 'tags'>

function normalizeSearchText(value: string): string {
  return normalizeText(value)
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, ' ')
    .trim()
}

function getSearchTerms(query: string): string[] {
  const normalizedQuery = normalizeSearchText(query)
  const searchableText = normalizedQuery
    .replace(
      /^(?:please )?(?:where (?:is|are) |where did i (?:put|store) |find |search for |look for |show me )/,
      '',
    )
    .replace(/^(?:(?:me|my|the|a|an) )+/, '')
  const words = (searchableText || normalizedQuery).split(/\s+/).filter(Boolean)
  return [...new Set(words)]
}

function scoreFields(fields: string[], normalizedQuery: string, terms: string[]): number {
  let bestScore = 0
  const normalizedFields = fields.map(normalizeSearchText).filter(Boolean)

  normalizedFields.forEach((normalizedField, fieldIndex) => {
    const fieldWeight = Math.max(1, fields.length - fieldIndex)
    if (normalizedField === normalizedQuery) {
      bestScore = Math.max(bestScore, 400 + fieldWeight)
    } else if (normalizedField.startsWith(normalizedQuery)) {
      bestScore = Math.max(bestScore, 300 + fieldWeight)
    } else if (normalizedField.includes(normalizedQuery)) {
      bestScore = Math.max(bestScore, 200 + fieldWeight)
    }
  })

  const searchableDocument = normalizedFields.join(' ')
  if (terms.every((term) => searchableDocument.includes(term))) {
    bestScore = Math.max(bestScore, 100)
  }

  return bestScore
}

export function searchInventory(
  bins: SearchableBin[],
  items: SearchableItem[],
  query: string,
): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query)
  const terms = getSearchTerms(query)
  if (!normalizedQuery || terms.length === 0) return []

  const binsById = new Map(bins.map((bin) => [bin.id, bin]))
  const matches: Array<{ result: SearchResult; score: number }> = []

  for (const item of items) {
    const bin = binsById.get(item.binId)
    if (!bin) continue

    const score = scoreFields(
      [item.name, item.description ?? '', ...item.tags],
      normalizedQuery,
      terms,
    )
    if (score === 0) continue

    matches.push({
      score,
      result: {
        type: 'item',
        itemId: item.id,
        binId: bin.id,
        title: item.name,
        subtitle: bin.name,
        location: bin.location,
        matchField: 'item',
      },
    })
  }

  for (const bin of bins) {
    const score = scoreFields(
      [bin.name, bin.description ?? '', bin.category ?? '', bin.location ?? '', ...bin.tags],
      normalizedQuery,
      terms,
    )
    if (score === 0) continue

    matches.push({
      score,
      result: {
        type: 'bin',
        binId: bin.id,
        title: bin.name,
        subtitle: bin.category ?? 'Bin',
        location: bin.location,
        matchField: 'bin',
      },
    })
  }

  return matches
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .map(({ result }) => result)
}
