export function createId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function normalizeText(value: string): string {
  return value.trim().toLowerCase()
}

export function slugify(value: string): string {
  return normalizeText(value).replace(/\s+/g, '-')
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function generatePlaceholderImage(label: string, hue = 145): string {
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${hue}, 28%, 88%)"/>
        <stop offset="100%" stop-color="hsl(${hue}, 22%, 78%)"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" fill="url(#g)"/>
    <text x="200" y="220" text-anchor="middle" font-family="ui-serif, Georgia, serif" font-size="72" fill="hsl(${hue}, 24%, 28%)">${initials}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function getAppOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin
  return 'https://trove.app'
}

export function getQrUrl(qrToken: string): string {
  return `${getAppOrigin()}/b/${qrToken}`
}

export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return Boolean(url && key && !url.includes('your-project'))
}

export function parseTagsInput(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
}

export function joinTags(tags: string[]): string {
  return tags.join(', ')
}
