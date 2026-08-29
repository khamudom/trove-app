import { describe, expect, it } from 'vitest'
import { parseItemVoiceInput } from './parseItemVoiceInput'

describe('parseItemVoiceInput', () => {
  it('parses a complete spoken item', () => {
    expect(parseItemVoiceInput(
      'Add Superman comic book. Description is first edition of the Superman comic book. Tag it comic, collectible.',
    )).toEqual({
      name: 'Superman comic book',
      description: 'first edition of the Superman comic book',
      tags: ['comic', 'collectible'],
    })
  })

  it('parses individual fields so users can dictate in steps', () => {
    expect(parseItemVoiceInput('Description is still in the original box')).toEqual({
      description: 'still in the original box',
    })
    expect(parseItemVoiceInput('Tags are toy and collectible')).toEqual({
      tags: ['toy', 'collectible'],
    })
  })

  it('does not treat unstructured speech as an item name', () => {
    expect(parseItemVoiceInput('Superman comic book')).toEqual({})
  })
})
