import { describe, expect, it, vi } from 'vitest'
import {
  MAX_PHOTOS_PER_BATCH,
  UNTITLED_PHOTO_NAME,
  addItemsFromPhotos,
  photoBatchNotice,
} from './addItemsFromPhotos'

function photo(name: string, type = 'image/jpeg') {
  return new File(['photo'], name, { type })
}

describe('addItemsFromPhotos', () => {
  it('creates one item per photo using the stored image and AI details', async () => {
    const saveItem = vi.fn().mockResolvedValue(undefined)
    const prepareImage = vi.fn(async (_file: File, options?: { maxDimension?: number }) => (
      options?.maxDimension ? 'data:image/jpeg;base64,vision' : 'data:image/jpeg;base64,full'
    ))
    const extractDetails = vi.fn()
      .mockResolvedValueOnce({
        name: 'Wool coat',
        description: 'Gray wool',
        tags: ['null', 'coat', 'winter'],
      })
      .mockResolvedValueOnce({})
    const onProgress = vi.fn()

    const result = await addItemsFromPhotos(
      [photo('coat.jpg'), photo('notes.txt', 'text/plain'), photo('hat.heic', '')],
      {
        saveItem,
        context: { binName: 'Winter' },
        onProgress,
        prepareImage,
        extractDetails,
      },
    )

    expect(result).toEqual({ added: 2, failed: 0, skipped: 0 })
    expect(extractDetails).toHaveBeenNthCalledWith(1, 'data:image/jpeg;base64,vision', { binName: 'Winter' })
    expect(saveItem).toHaveBeenNthCalledWith(1, {
      name: 'Wool coat',
      image: 'data:image/jpeg;base64,full',
      tags: ['coat'],
    })
    expect(saveItem).toHaveBeenNthCalledWith(2, {
      name: UNTITLED_PHOTO_NAME,
      image: 'data:image/jpeg;base64,full',
      tags: [],
    })
    expect(onProgress).toHaveBeenNthCalledWith(1, { index: 1, total: 2 })
    expect(onProgress).toHaveBeenNthCalledWith(2, { index: 2, total: 2 })
  })

  it('replaces a null name with a placeholder and omits a null description', async () => {
    const saveItem = vi.fn().mockResolvedValue(undefined)

    await addItemsFromPhotos([photo('jacket.jpg')], {
      saveItem,
      prepareImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,full'),
      extractDetails: vi.fn().mockResolvedValue({
        name: 'null',
        description: 'null',
        tags: ['jacket'],
      }),
    })

    expect(saveItem).toHaveBeenCalledWith({
      name: UNTITLED_PHOTO_NAME,
      image: 'data:image/jpeg;base64,full',
      tags: ['jacket'],
    })
  })

  it('keeps the photo when identification fails and counts unreadable photos', async () => {
    const saveItem = vi.fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('save failed'))
    const prepareImage = vi.fn(async (file: File) => {
      if (file.name === 'broken.jpg') throw new Error('Could not read this photo')
      return 'data:image/jpeg;base64,full'
    })

    const result = await addItemsFromPhotos(
      [photo('blurry.jpg'), photo('broken.jpg'), photo('full.jpg')],
      {
        saveItem,
        prepareImage,
        extractDetails: vi.fn().mockRejectedValue(new Error('unavailable')),
      },
    )

    expect(result).toEqual({ added: 1, failed: 2, skipped: 0 })
    expect(saveItem).toHaveBeenCalledWith({
      name: UNTITLED_PHOTO_NAME,
      image: 'data:image/jpeg;base64,full',
      tags: [],
    })
  })

  it('leaves photos beyond the batch limit for another pass', async () => {
    const files = Array.from({ length: MAX_PHOTOS_PER_BATCH + 2 }, (_, index) => photo(`${index}.jpg`))
    const result = await addItemsFromPhotos(files, {
      saveItem: vi.fn().mockResolvedValue(undefined),
      prepareImage: vi.fn().mockResolvedValue('data:image/jpeg;base64,full'),
      extractDetails: vi.fn().mockResolvedValue({ name: 'Screwdriver' }),
    })

    expect(result).toEqual({ added: MAX_PHOTOS_PER_BATCH, failed: 0, skipped: 2 })
  })
})

describe('photoBatchNotice', () => {
  it('tells the user to edit guesses and reports partial failures', () => {
    expect(photoBatchNotice({ added: 2, failed: 0, skipped: 0 }))
      .toBe('Added 2 items from photos. Edit any that look wrong.')
    expect(photoBatchNotice({ added: 1, failed: 0, skipped: 0 }))
      .toBe('Added 1 item from photos. Edit any that look wrong.')
    expect(photoBatchNotice({ added: 3, failed: 1, skipped: 2 }))
      .toBe('Added 3 of 4 photos. Edit any that look wrong. Extra photos were left out.')
    expect(photoBatchNotice({ added: 0, failed: 2, skipped: 0 }))
      .toBe('Could not add those photos. Try again.')
    expect(photoBatchNotice({ added: 0, failed: 0, skipped: 0 }))
      .toBe('Choose photos to add.')
  })
})
