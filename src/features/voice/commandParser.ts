import type { ParsedVoiceCommand } from './voiceCommands'

function clean(text: string): string {
  return text.trim().replace(/\.$/, '').replace(/\?/g, '')
}

export function parseVoiceCommand(raw: string): ParsedVoiceCommand {
  const text = clean(raw.toLowerCase())

  const addMatch = text.match(/^add (.+?) to (?:the )?(.+)$/)
  if (addMatch) {
    return {
      command: { intent: 'add_item', itemName: addMatch[1].trim(), binName: addMatch[2].trim() },
      confidence: 'high',
    }
  }

  const findMatch = text.match(/^(?:where did i put|find|search for|look for) (?:my |the )?(.+)$/)
  if (findMatch) {
    return {
      command: { intent: 'find_item', query: findMatch[1].trim() },
      confidence: 'high',
    }
  }

  const listMatch = text.match(/^(?:what is in|what's in|show me what's in|list) (?:the )?(.+?)(?: bin)?$/)
  if (listMatch) {
    return {
      command: { intent: 'list_bin_contents', binName: listMatch[1].trim() },
      confidence: 'high',
    }
  }

  const showMatch = text.match(/^(?:show me|open) (?:the )?(.+?)(?: bin)?$/)
  if (showMatch) {
    return {
      command: { intent: 'show_bin', binName: showMatch[1].trim() },
      confidence: 'high',
    }
  }

  const searchMatch = text.match(/^search for (.+)$/)
  if (searchMatch) {
    return {
      command: { intent: 'search', query: searchMatch[1].trim() },
      confidence: 'high',
    }
  }

  return { command: { intent: 'unknown' }, confidence: 'low' }
}
