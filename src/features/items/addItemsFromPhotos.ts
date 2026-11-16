import { extractItemFromImage, type ItemImageContext, type ParsedItemImage } from './extractItemFromImage'
import { prepareItemImage } from './prepareItemImage'

export const MAX_PHOTOS_PER_BATCH = 24
export const UNTITLED_PHOTO_NAME = 'Untitled photo'

const VISION_MAX_DIMENSION = 768
const VISION_QUALITY = 0.7

export interface PhotoItemInput {
  name: string
  description?: string
  image: string
  tags: string[]
}

export interface PhotoAddProgress {
  index: number
  total: number
}

export interface AddItemsFromPhotosResult {
  added: number
  failed: number
  skipped: number
}

interface PrepareImage {
  (file: File, options?: { maxDimension?: number; quality?: number }): Promise<string>
}

interface AddItemsFromPhotosOptions {
  saveItem: (item: PhotoItemInput) => Promise<void>
  context?: ItemImageContext
  onProgress?: (progress: PhotoAddProgress) => void
  prepareImage?: PrepareImage
  extractDetails?: (image: string, context?: ItemImageContext) => Promise<ParsedItemImage>
}

function usableField(value?: string): string | undefined {
  const text = value?.trim()
  if (!text || /^(null|undefined|n\/a|none)$/i.test(text)) return undefined
  return text
}

function singleTag(tags?: string[]): string[] {
  const tag = tags?.map((entry) => usableField(entry)).find((entry): entry is string => Boolean(entry))
  return tag ? [tag] : []
}

export function isPhotoFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(file.name)
}

export function photoBatchNotice(result: AddItemsFromPhotosResult): string {
  if (result.added === 0 && result.failed === 0) return 'Choose photos to add.'
  if (result.added === 0) return 'Could not add those photos. Try again.'

  const lead = result.failed > 0
    ? `Added ${result.added} of ${result.added + result.failed} photos.`
    : `Added ${result.added === 1 ? '1 item' : `${result.added} items`} from photos.`
  const extra = result.skipped > 0 ? ' Extra photos were left out.' : ''
  return `${lead} Edit any that look wrong.${extra}`
}

export async function addItemsFromPhotos(
  files: File[],
  options: AddItemsFromPhotosOptions,
): Promise<AddItemsFromPhotosResult> {
  const prepareImage = options.prepareImage ?? prepareItemImage
  const extractDetails = options.extractDetails ?? extractItemFromImage
  const photos = files.filter(isPhotoFile)
  const batch = photos.slice(0, MAX_PHOTOS_PER_BATCH)
  let added = 0
  let failed = 0

  for (let index = 0; index < batch.length; index += 1) {
    const file = batch[index]
    options.onProgress?.({ index: index + 1, total: batch.length })

    let image: string
    try {
      image = await prepareImage(file)
    } catch {
      failed += 1
      continue
    }

    let visionImage = image
    try {
      visionImage = await prepareImage(file, {
        maxDimension: VISION_MAX_DIMENSION,
        quality: VISION_QUALITY,
      })
    } catch {
      visionImage = image
    }

    let parsed: ParsedItemImage = {}
    try {
      parsed = await extractDetails(visionImage, options.context)
    } catch {
      parsed = {}
    }

    try {
      await options.saveItem({
        name: usableField(parsed.name) || UNTITLED_PHOTO_NAME,
        image,
        tags: singleTag(parsed.tags),
      })
      added += 1
    } catch {
      failed += 1
    }
  }

  return {
    added,
    failed,
    skipped: photos.length - batch.length,
  }
}
