const MAX_IMAGE_DIMENSION = 1280
const JPEG_QUALITY = 0.82

interface PrepareItemImageOptions {
  maxDimension?: number
  quality?: number
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not read this photo'))
    }
    image.src = objectUrl
  })
}

export async function prepareItemImage(
  file: File,
  options: PrepareItemImageOptions = {},
): Promise<string> {
  if (!file.type.startsWith('image/') && !isPhotoFileName(file.name)) {
    throw new Error('Choose an image file')
  }

  const maxDimension = options.maxDimension ?? MAX_IMAGE_DIMENSION
  const quality = options.quality ?? JPEG_QUALITY
  const image = await loadImage(file)
  const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) throw new Error('Photo processing is unavailable')

  canvas.width = width
  canvas.height = height
  context.fillStyle = '#fff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return canvas.toDataURL('image/jpeg', quality)
}

function isPhotoFileName(name: string): boolean {
  return /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)$/i.test(name)
}
