import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extractItemVoiceInput } from './extractItemVoiceInput'

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}))

describe('extractItemVoiceInput', () => {
  beforeEach(() => {
    mocks.invoke.mockReset()
    mocks.getSupabaseClient.mockReset()
  })

  it('returns normalized item details from the AI function', async () => {
    mocks.getSupabaseClient.mockReturnValue({
      functions: { invoke: mocks.invoke },
    })
    mocks.invoke.mockResolvedValue({
      data: {
        name: '  Gargoyle comic book  ',
        description: 'First edition',
        tags: [' comic ', 'collectible'],
      },
      error: null,
    })

    await expect(extractItemVoiceInput(
      'I found my first-edition Gargoyle comic book for the collectible shelf.',
    )).resolves.toEqual({
      name: 'Gargoyle comic book',
      description: 'First edition',
      tags: ['comic', 'collectible'],
    })
  })

  it('falls back to deterministic parsing when AI is unavailable', async () => {
    mocks.getSupabaseClient.mockReturnValue({
      functions: { invoke: mocks.invoke },
    })
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('Unavailable') })

    await expect(extractItemVoiceInput(
      'Add Superman comic book. Description is first edition. Tag it comic, collectible.',
    )).resolves.toEqual({
      name: 'Superman comic book',
      description: 'first edition',
      tags: ['comic', 'collectible'],
    })
  })
})
