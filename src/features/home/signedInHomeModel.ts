import type { Bin, Item } from '@/types'

const MS_PER_DAY = 1000 * 60 * 60 * 24
const ARCHIVE_MIN_DAYS = 30
const SPARSE_ITEM_LIMIT = 1
const RECENT_BIN_LIMIT = 8
const LOOSE_END_LIMIT = 3

const BIN_ACCENTS = ['#e4c9a5', '#d5e3d4', '#ead9d0'] as const

export const HOME_TIPS = [
  {
    tag: 'TIP · LABELING',
    title: 'Photograph the open bin',
    body: 'A photo of the contents beats any written list. Snap one each time you close a lid.',
  },
  {
    tag: 'TIP · SEARCH',
    title: 'Name things the way you ask',
    body: 'If you’d say “the good scissors,” put that in the name or a tag.',
  },
  {
    tag: 'TIP · HABIT',
    title: 'Add it when the lid closes',
    body: 'A 20-second note now beats a 20-minute hunt later.',
  },
] as const

type SeasonalTheme = {
  months: number[]
  keywords: string[]
  tag: string
  title: string
  body: (count: number) => string
  link: (count: number) => string
}

const SEASONAL_THEMES: SeasonalTheme[] = [
  {
    months: [7, 8],
    keywords: ['camp', 'tent', 'hiking', 'hike', 'outdoor', 'backpack'],
    tag: 'SEASON AHEAD',
    title: 'Camping season winds down',
    body: (count) =>
      count === 1
        ? 'Your gear lives in 1 bin. Pack it away before it hibernates.'
        : `Your gear is spread across ${count} bins. Consolidate before it hibernates.`,
    link: (count) => (count === 1 ? 'Show the bin →' : `Show the ${count} bins →`),
  },
  {
    months: [9, 10],
    keywords: ['halloween', 'costume', 'spooky'],
    tag: 'SEASON AHEAD',
    title: 'Halloween is around the corner',
    body: (count: number) =>
      count === 1
        ? 'Your costumes and decor are in 1 bin. Dig them out before the rush.'
        : `Costumes and decor are spread across ${count} bins.`,
    link: (count: number) => (count === 1 ? 'Show the bin →' : `Show the ${count} bins →`),
  },
  {
    months: [10, 11],
    keywords: ['holiday', 'christmas', 'xmas', 'ornament', 'decor'],
    tag: 'SEASON AHEAD',
    title: 'Holiday bins are waiting',
    body: (count: number) =>
      count === 1
        ? 'Your holiday bin is ready when you are.'
        : `Holiday things are split across ${count} bins. Gather them before decorating day.`,
    link: (count: number) => (count === 1 ? 'Show the bin →' : `Show the ${count} bins →`),
  },
  {
    months: [2, 3],
    keywords: ['garden', 'plant', 'yard', 'lawn', 'patio'],
    tag: 'SEASON AHEAD',
    title: 'Garden season is starting',
    body: (count: number) =>
      count === 1
        ? 'Your garden gear is in 1 bin. Pull it before the first warm weekend.'
        : `Garden gear is spread across ${count} bins.`,
    link: (count: number) => (count === 1 ? 'Show the bin →' : `Show the ${count} bins →`),
  },
  {
    months: [3, 4],
    keywords: ['winter', 'ski', 'snow', 'coat', 'parka'],
    tag: 'SEASON AHEAD',
    title: 'Winter gear can rest',
    body: (count: number) =>
      count === 1
        ? 'Your winter bin can go back into storage.'
        : `Winter gear is spread across ${count} bins. Put it away together.`,
    link: (count: number) => (count === 1 ? 'Show the bin →' : `Show the ${count} bins →`),
  },
]

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening'

export type ArchiveHighlight = {
  item: Item
  bin: Bin
  badge: string
}

export type WeekInsight = {
  tag: string
  title: string
  body: string
  linkLabel: string
  href: string
}

export type HomeTip = (typeof HOME_TIPS)[number]

export type LooseEnd = {
  id: string
  href: string
  title: string
  subtitle: string
  kind: 'bin' | 'item'
  image?: string
  accent: string
}

export type RecentBinCard = {
  id: string
  name: string
  location?: string
  itemCount: number
  previewImage?: string
  accent: string
}

export type SignedInHomeModel = {
  firstName: string | null
  period: GreetingPeriod
  itemCount: number
  binCount: number
  searchExample: string | null
  archive: ArchiveHighlight | null
  insight: WeekInsight | null
  tip: HomeTip
  looseEnds: LooseEnd[]
  recentBins: RecentBinCard[]
  addedThisMonth: number
  untouchedCount: number
}

export function greetingPeriod(now = new Date()): GreetingPeriod {
  const hour = now.getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

export function firstNameFromIdentity(displayName?: string, email?: string): string | null {
  const source = displayName?.trim() || email?.split('@')[0]?.trim()
  if (!source) return null
  const token = source.split(/[\s._+-]/).find((part) => part.length > 0)
  if (!token) return null
  return token.charAt(0).toUpperCase() + token.slice(1)
}

export function binAccent(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) {
    hash += id.charCodeAt(i) * (i + 1)
  }
  return BIN_ACCENTS[hash % BIN_ACCENTS.length]
}

export function monthsUntouched(updatedAt: string, now = Date.now()): number {
  const days = Math.floor((now - new Date(updatedAt).getTime()) / MS_PER_DAY)
  return Math.max(0, Math.floor(days / 30))
}

export function archiveBadge(updatedAt: string, now = Date.now()): string | null {
  const months = monthsUntouched(updatedAt, now)
  if (months < 1) return null
  return months === 1 ? 'UNTOUCHED FOR 1 MONTH' : `UNTOUCHED FOR ${months} MONTHS`
}

export function formatElapsed(iso: string, now = Date.now()): string {
  const days = Math.floor((now - new Date(iso).getTime()) / MS_PER_DAY)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  if (months < 12) return months === 1 ? '1 month ago' : `${months} months ago`
  const years = Math.floor(days / 365)
  return years === 1 ? '1 year ago' : `${years} years ago`
}

function matchesKeywords(value: string, keywords: readonly string[]): boolean {
  const haystack = value.toLowerCase()
  return keywords.some((keyword) => haystack.includes(keyword))
}

function binSearchText(bin: Bin): string {
  return [bin.name, bin.category ?? '', bin.location ?? '', bin.description ?? '', ...bin.tags].join(' ')
}

function parseLent(item: Item): { person?: string } | null {
  const text = [item.name, item.description ?? '', ...item.tags].join(' ')
  if (!/\b(lent|loaned|borrowed)\b/i.test(text)) return null
  const match = text.match(/\b(?:lent|loaned|borrowed)\s+to\s+([A-Za-z]+)/i)
  return { person: match?.[1] }
}

function pickArchive(items: Item[], bins: Bin[], now: number): ArchiveHighlight | null {
  const binsById = new Map(bins.map((bin) => [bin.id, bin]))
  const ranked = [...items]
    .filter((item) => {
      const ageDays = (now - new Date(item.updatedAt).getTime()) / MS_PER_DAY
      return ageDays >= ARCHIVE_MIN_DAYS && binsById.has(item.binId)
    })
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))

  const item = ranked[0]
  if (!item) return null
  const bin = binsById.get(item.binId)
  const badge = archiveBadge(item.updatedAt, now)
  if (!bin || !badge) return null
  return { item, bin, badge }
}

function pickInsight(bins: Bin[], now: Date): WeekInsight | null {
  const month = now.getMonth()
  const theme = SEASONAL_THEMES.find((entry) => entry.months.includes(month))
  if (!theme) return null

  const matches = bins.filter((bin) => matchesKeywords(binSearchText(bin), theme.keywords))
  if (matches.length === 0) return null

  const href = matches.length === 1 ? `/bins/${matches[0].id}` : '/bins'
  return {
    tag: theme.tag,
    title: theme.title,
    body: theme.body(matches.length),
    linkLabel: theme.link(matches.length),
    href,
  }
}

function pickLooseEnds(
  bins: Bin[],
  items: Item[],
  counts: Record<string, number>,
  now: number,
): LooseEnd[] {
  const lent: LooseEnd[] = items.flatMap((item) => {
    const lentInfo = parseLent(item)
    if (!lentInfo) return []
    const person = lentInfo.person
    return [
      {
        id: `item-${item.id}`,
        href: `/bins/${item.binId}?item=${item.id}`,
        title: person ? `${item.name} lent to ${person}` : `${item.name} is out on loan`,
        subtitle: `${formatElapsed(item.updatedAt, now)} · Nudge ${person ?? 'them'}?`,
        kind: 'item',
        image: item.image,
        accent: '#e6c36a',
      },
    ]
  })

  const sparse: LooseEnd[] = bins
    .filter((bin) => (counts[bin.id] ?? 0) <= SPARSE_ITEM_LIMIT)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((bin) => {
      const count = counts[bin.id] ?? 0
      return {
        id: `bin-${bin.id}`,
        href: `/bins/${bin.id}`,
        title: `${bin.name} has ${count} ${count === 1 ? 'item' : 'items'}`,
        subtitle:
          count === 0
            ? 'Add what’s inside while you remember.'
            : 'Add the rest while you remember what’s inside.',
        kind: 'bin',
        image: bin.previewImage,
        accent: binAccent(bin.id),
      }
    })

  return [...lent, ...sparse].slice(0, LOOSE_END_LIMIT)
}

function isSameMonth(iso: string, now: Date): boolean {
  const date = new Date(iso)
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

export function buildSignedInHomeModel(input: {
  bins: Bin[]
  items: Item[]
  recentBins: Bin[]
  displayName?: string
  email?: string
  now?: Date
}): SignedInHomeModel {
  const nowDate = input.now ?? new Date()
  const now = nowDate.getTime()
  const counts = Object.fromEntries(
    input.bins.map((bin) => [bin.id, input.items.filter((item) => item.binId === bin.id).length]),
  )
  const recentlyUpdated = [...input.items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const tipIndex = Math.floor((nowDate.getFullYear() * 366 + dayOfYear(nowDate)) % HOME_TIPS.length)

  return {
    firstName: firstNameFromIdentity(input.displayName, input.email),
    period: greetingPeriod(nowDate),
    itemCount: input.items.length,
    binCount: input.bins.length,
    searchExample: recentlyUpdated[0]?.name ?? null,
    archive: pickArchive(input.items, input.bins, now),
    insight: pickInsight(input.bins, nowDate),
    tip: HOME_TIPS[tipIndex],
    looseEnds: pickLooseEnds(input.bins, input.items, counts, now),
    recentBins: input.recentBins.slice(0, RECENT_BIN_LIMIT).map((bin) => ({
      id: bin.id,
      name: bin.name,
      location: bin.location,
      itemCount: counts[bin.id] ?? 0,
      previewImage: bin.previewImage,
      accent: binAccent(bin.id),
    })),
    addedThisMonth: input.items.filter((item) => isSameMonth(item.createdAt, nowDate)).length,
    untouchedCount: input.items.filter((item) => monthsUntouched(item.updatedAt, now) >= 1).length,
  }
}

function dayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / MS_PER_DAY)
}
