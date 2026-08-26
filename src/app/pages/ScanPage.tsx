import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@khamudom/lumen-ui-react'
import { EmptyState } from '@/components/EmptyState'
import { PageHeader } from '@/components/PageHeader'
import { canUseInAppCamera, createQrFrameScanner, extractTroveBinPath } from '@/lib/qrScan'
import styles from './ScanPage.module.css'

type ScanStatus = 'starting' | 'live' | 'unavailable'

const UNSUPPORTED_MESSAGE =
  'This browser cannot open the camera inside the app. Use your phone camera app to scan a Trove QR label instead.'

export function ScanPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const cameraSupported = canUseInAppCamera()
  const [status, setStatus] = useState<ScanStatus>(cameraSupported ? 'starting' : 'unavailable')
  const [error, setError] = useState(cameraSupported ? '' : UNSUPPORTED_MESSAGE)
  const [restartKey, setRestartKey] = useState(0)

  const retry = useCallback(() => {
    if (!canUseInAppCamera()) {
      setStatus('unavailable')
      setError(UNSUPPORTED_MESSAGE)
      return
    }
    setError('')
    setStatus('starting')
    setRestartKey((key) => key + 1)
  }, [])

  useEffect(() => {
    if (!canUseInAppCamera()) return

    let stream: MediaStream | null = null
    let cancelled = false
    let timer = 0
    const scanner = createQrFrameScanner()

    const stop = () => {
      window.clearTimeout(timer)
      scanner.dispose()
      stream?.getTracks().forEach((track) => track.stop())
      stream = null
      if (videoRef.current) videoRef.current.srcObject = null
    }

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }

        const video = videoRef.current
        if (!video) {
          setStatus('unavailable')
          setError('Camera view failed to load. Try again.')
          stop()
          return
        }

        video.srcObject = stream
        await video.play()
        if (cancelled) return
        setStatus('live')

        const tick = async () => {
          if (cancelled || !videoRef.current) return
          try {
            const raw = await scanner.detect(videoRef.current)
            const path = raw ? extractTroveBinPath(raw) : null
            if (path) {
              navigate(path)
              return
            }
          } catch {
            // Keep scanning on transient decode errors.
          }
          timer = window.setTimeout(() => void tick(), 180)
        }

        void tick()
      } catch {
        if (cancelled) return
        setStatus('unavailable')
        setError('Camera permission is required to scan inside the app. Allow camera access, or scan the QR label with your phone camera app.')
        stop()
      }
    }

    void start()

    return () => {
      cancelled = true
      stop()
    }
  }, [navigate, restartKey])

  if (status === 'unavailable') {
    return (
      <div className={styles.page}>
        <PageHeader title="Scan" subtitle="Scan a Trove QR label to open its bin." />
        <EmptyState
          title="Camera unavailable"
          description={error || 'Allow camera access to scan Trove QR labels inside the app.'}
          action={(
            <div className={styles.actions}>
              <Button variant="primary" onClick={retry}>Try camera again</Button>
              <Button variant="secondary" onClick={() => navigate('/bins')}>Browse bins</Button>
            </div>
          )}
        />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Scan"
        subtitle={status === 'starting'
          ? 'Starting camera…'
          : 'Align a Trove QR label inside the frame.'}
      />
      <div className={styles.viewfinder}>
        <video ref={videoRef} className={styles.video} muted playsInline autoPlay />
        <div className={styles.frame} aria-hidden />
      </div>
    </div>
  )
}
