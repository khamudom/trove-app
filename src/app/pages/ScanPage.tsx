import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/Button'
import { EmptyState } from '@/components/EmptyState'
import styles from './ScanPage.module.css'

export function ScanPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [supported, setSupported] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const hasDetector = 'BarcodeDetector' in window
    setSupported(hasDetector)
    if (!hasDetector) return

    let stream: MediaStream | null = null
    let frame = 0

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        const Detector = (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
        const detector = new Detector({ formats: ['qr_code'] })

        const tick = async () => {
          if (!videoRef.current) return
          try {
            const codes = await detector.detect(videoRef.current)
            const match = codes.find((code) => /\/b\/[a-f0-9]+/i.test(code.rawValue))
            if (match) {
              const url = new URL(match.rawValue)
              navigate(url.pathname)
              return
            }
          } catch {
            // continue scanning
          }
          frame = requestAnimationFrame(() => void tick())
        }

        void tick()
      } catch {
        setError('Camera unavailable. You can still scan with your phone camera app.')
        setSupported(false)
      }
    }

    void start()

    return () => {
      cancelAnimationFrame(frame)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [navigate])

  if (supported === false) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Use your phone camera"
          description={error || 'Point your camera at a Trove QR label. It will open the bin contents instantly — no sign-in required.'}
          action={<Button variant="secondary" onClick={() => navigate('/bins')}>Browse bins</Button>}
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header>
        <h1>Scan</h1>
        <p className={styles.subtitle}>Align a Trove QR label inside the frame.</p>
      </header>
      <div className={styles.viewfinder}>
        <video ref={videoRef} className={styles.video} muted playsInline />
        <div className={styles.frame} aria-hidden />
      </div>
    </div>
  )
}
