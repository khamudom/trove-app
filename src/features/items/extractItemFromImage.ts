import { getSupabaseClient } from '@/lib/supabase'

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 500
const MAX_TAG_LENGTH = 40
const MAX_TAGS = 8
const MAX_IMAGE_LENGTH = 1_500_000

export interface ItemImageContext {
  binName?: string
  category?: string
  location?: string
}

export interface ParsedItemImage {
  name?: string
  description?: string
  tags?: string[]
}

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  if (!text || /^(null|undefined|n\/a|none)$/i.test(text)) return undefined
  return text.slice(0, maxLength)
}

function normalizeExtraction(value: unknown): ParsedItemImage {
  if (!value || typeof value !== 'object') return {}

  const result = value as Record<string, unknown>
  const name = optionalText(result.name, MAX_NAME_LENGTH)
  const description = optionalText(result.description, MAX_DESCRIPTION_LENGTH)
  const tags = Array.isArray(result.tags)
    ? result.tags
      .map((tag) => optionalText(tag, MAX_TAG_LENGTH))
      .filter((tag): tag is string => Boolean(tag))
      .slice(0, MAX_TAGS)
    : []

  return {
    ...(name ? { name } : {}),
    ...(description ? { description } : {}),
    ...(tags.length ? { tags } : {}),
  }
}

function contextPayload(context: ItemImageContext) {
  return {
    ...(context.binName ? { binName: context.binName } : {}),
    ...(context.category ? { category: context.category } : {}),
    ...(context.location ? { location: context.location } : {}),
  }
}

export async function extractItemFromImage(
  imageDataUrl: string,
  context: ItemImageContext = {},
): Promise<ParsedItemImage> {
  if (!imageDataUrl.startsWith('data:image/') || imageDataUrl.length > MAX_IMAGE_LENGTH) return {}

  const client = getSupabaseClient()
  if (!client) return {}

  try {
    const { data, error } = await client.functions.invoke('parse-item-image', {
      body: { image: imageDataUrl, ...contextPayload(context) },
    })
    if (error) return {}
    return normalizeExtraction(data)
  } catch {
    return {}
  }
}
