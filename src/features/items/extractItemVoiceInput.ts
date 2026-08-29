import { getSupabaseClient } from '@/lib/supabase'
import {
  parseItemVoiceInput,
  type ParsedItemVoiceInput,
} from './parseItemVoiceInput'

const MAX_NAME_LENGTH = 120
const MAX_DESCRIPTION_LENGTH = 500
const MAX_TAG_LENGTH = 40
const MAX_TAGS = 8

function optionalText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim()
  return text ? text.slice(0, maxLength) : undefined
}

function normalizeExtraction(value: unknown): ParsedItemVoiceInput {
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

export async function extractItemVoiceInput(
  transcript: string,
): Promise<ParsedItemVoiceInput> {
  const fallback = () => parseItemVoiceInput(transcript)
  const client = getSupabaseClient()
  if (!client) return fallback()

  try {
    const { data, error } = await client.functions.invoke('parse-item-voice', {
      body: { transcript },
    })
    if (error) return fallback()

    const parsed = normalizeExtraction(data)
    return parsed.name || parsed.description || parsed.tags ? parsed : fallback()
  } catch {
    return fallback()
  }
}
