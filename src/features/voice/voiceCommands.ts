export type VoiceIntent =
  | { intent: 'add_item'; itemName: string; binName: string }
  | { intent: 'find_item'; query: string }
  | { intent: 'show_bin'; binName: string }
  | { intent: 'list_bin_contents'; binName: string }
  | { intent: 'search'; query: string }
  | { intent: 'unknown' }

export interface ParsedVoiceCommand {
  command: VoiceIntent
  confidence: 'high' | 'low'
}
