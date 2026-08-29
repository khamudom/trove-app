import { parseTagsInput } from '@/lib/utils'

export interface ParsedItemVoiceInput {
  name?: string
  description?: string
  tags?: string[]
}

const FIELD_MARKER = /\b(description is|describe it as|tag it|tags? (?:are|is))\b/gi

function cleanValue(value: string): string {
  return value
    .trim()
    .replace(/^[,.;:\s]+/, '')
    .replace(/[,.;:\s]+$/, '')
    .trim()
}

function parseSpokenTags(value: string): string[] {
  return parseTagsInput(value.replace(/\s+(?:and|or)\s+/gi, ','))
}

export function parseItemVoiceInput(transcript: string): ParsedItemVoiceInput {
  const matches = [...transcript.matchAll(FIELD_MARKER)]
  const parsed: ParsedItemVoiceInput = {}

  const nameEnd = matches[0]?.index ?? transcript.length
  const name = cleanValue(
    transcript
      .slice(0, nameEnd)
      .replace(/^(?:please\s+)?add\s+(?:an?\s+|the\s+)?/i, ''),
  )

  if (name && name.length !== transcript.trim().length) parsed.name = name
  else if (/^(?:please\s+)?add\b/i.test(transcript.trim()) && name) parsed.name = name

  matches.forEach((match, index) => {
    const marker = match[0].toLowerCase()
    const valueStart = (match.index ?? 0) + match[0].length
    const valueEnd = matches[index + 1]?.index ?? transcript.length
    const value = cleanValue(transcript.slice(valueStart, valueEnd))
    if (!value) return

    if (marker.startsWith('description') || marker === 'describe it as') {
      parsed.description = value
    } else {
      parsed.tags = parseSpokenTags(value)
    }
  })

  return parsed
}
