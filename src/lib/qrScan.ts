const TROVE_BIN_PATH = /\/b\/[a-f0-9]+/i

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>
}

type JsQrModule = typeof import('jsqr')

let jsQRLoader: Promise<JsQrModule['default']> | null = null

function loadJsQR(): Promise<JsQrModule['default']> {
  if (!jsQRLoader) {
    jsQRLoader = import('jsqr').then((mod) => mod.default)
  }
  return jsQRLoader
}

/** Extract a Trove public bin path (`/b/:token`) from a scanned QR payload. */
export function extractTroveBinPath(rawValue: string): string | null {
  const trimmed = rawValue.trim()
  if (!trimmed) return null

  try {
    const url = new URL(trimmed)
    const match = url.pathname.match(TROVE_BIN_PATH)
    return match ? match[0] : null
  } catch {
    const match = trimmed.match(TROVE_BIN_PATH)
    return match ? match[0] : null
  }
}

export function canUseInAppCamera(): boolean {
  return typeof navigator !== 'undefined'
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof window !== 'undefined'
    && window.isSecureContext
}

async function detectWithJsQR(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
): Promise<string | null> {
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.videoWidth === 0) {
    return null
  }

  // Downscale large frames for faster decode on mobile CPUs.
  const maxEdge = 640
  const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight))
  const width = Math.max(1, Math.floor(video.videoWidth * scale))
  const height = Math.max(1, Math.floor(video.videoHeight * scale))

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  ctx.drawImage(video, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const jsQR = await loadJsQR()
  const result = jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: 'dontInvert',
  })
  return result?.data ?? null
}

export type QrFrameScanner = {
  detect: (video: HTMLVideoElement) => Promise<string | null>
  dispose: () => void
}

/** Prefer native BarcodeDetector; fall back to jsQR for Safari / iOS. */
export function createQrFrameScanner(): QrFrameScanner {
  let detector: BarcodeDetectorLike | null = null
  if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      const Detector = (
        window as unknown as {
          BarcodeDetector: new (opts: { formats: string[] }) => BarcodeDetectorLike
        }
      ).BarcodeDetector
      detector = new Detector({ formats: ['qr_code'] })
    } catch {
      detector = null
    }
  }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { willReadFrequently: true })

  return {
    async detect(video: HTMLVideoElement): Promise<string | null> {
      if (detector) {
        try {
          const codes = await detector.detect(video)
          const value = codes.find((code) => code.rawValue)?.rawValue
          if (value) return value
        } catch {
          // Fall through to jsQR when the native detector fails on a frame.
        }
      }

      if (!ctx) return null
      return detectWithJsQR(video, canvas, ctx)
    },
    dispose() {
      canvas.width = 0
      canvas.height = 0
    },
  }
}
