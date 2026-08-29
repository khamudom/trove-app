const MAX_IMAGE_DIMENSION = 1280
const JPEG_QUALITY = 0.82

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

export async function prepareItemImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file')

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight))
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

  return canvas.toDataURL('image/jpeg', JPEG_QUALITY)
}
