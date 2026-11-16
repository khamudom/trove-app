import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extractItemFromImage } from './extractItemFromImage'

const mocks = vi.hoisted(() => ({
  getSupabaseClient: vi.fn(),
  invoke: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseClient: mocks.getSupabaseClient,
}))

const image = 'data:image/jpeg;base64,abc'

describe('extractItemFromImage', () => {
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
        name: '  Wool coat  ',
        description: 'Gray, knee length',
        tags: [' winter ', 'clothing'],
      },
      error: null,
    })

    await expect(extractItemFromImage(image, {
      binName: 'Winter',
      category: 'Clothes',
      location: 'Garage',
    })).resolves.toEqual({
      name: 'Wool coat',
      description: 'Gray, knee length',
      tags: ['winter', 'clothing'],
    })
    expect(mocks.invoke).toHaveBeenCalledWith('parse-item-image', {
      body: {
        image,
        binName: 'Winter',
        category: 'Clothes',
        location: 'Garage',
      },
    })
  })

  it('drops null placeholders and keeps the tags the model did find', async () => {
    mocks.getSupabaseClient.mockReturnValue({
      functions: { invoke: mocks.invoke },
    })
    mocks.invoke.mockResolvedValue({
      data: {
        name: 'null',
        description: 'null',
        tags: ['clothing', 'jacket', 'gray'],
      },
      error: null,
    })

    await expect(extractItemFromImage(image)).resolves.toEqual({
      tags: ['clothing', 'jacket', 'gray'],
    })
  })

  it('returns no details when AI is unavailable', async () => {
    mocks.getSupabaseClient.mockReturnValue({
      functions: { invoke: mocks.invoke },
    })
    mocks.invoke.mockResolvedValue({ data: null, error: new Error('Unavailable') })

    await expect(extractItemFromImage(image)).resolves.toEqual({})
  })

  it('returns no details without a configured client', async () => {
    mocks.getSupabaseClient.mockReturnValue(null)

    await expect(extractItemFromImage(image)).resolves.toEqual({})
    expect(mocks.invoke).not.toHaveBeenCalled()
  })
})
