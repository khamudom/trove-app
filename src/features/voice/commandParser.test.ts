import { describe, expect, it } from 'vitest'
import { parseVoiceCommand } from '@/features/voice/commandParser'

describe('parseVoiceCommand', () => {
  it('parses add item commands', () => {
    expect(parseVoiceCommand('Add hammer to the toolbox').command).toEqual({
      intent: 'add_item',
      itemName: 'hammer',
      binName: 'toolbox',
    })
  })

  it('parses find item commands', () => {
    expect(parseVoiceCommand('Where did I put the hammer?').command).toEqual({
      intent: 'find_item',
      query: 'hammer',
    })
  })

  it('parses list bin contents commands', () => {
    expect(parseVoiceCommand("What is in Camping Gear?").command).toEqual({
      intent: 'list_bin_contents',
      binName: 'camping gear',
    })
  })

  it('parses show bin commands', () => {
    expect(parseVoiceCommand('Show me the toolbox').command).toEqual({
      intent: 'show_bin',
      binName: 'toolbox',
    })
  })
})
