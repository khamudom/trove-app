import styles from './VoiceStatus.module.css'

interface VoiceStatusProps {
  status: 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'
  transcript?: string
  message?: string
}

const labels: Record<VoiceStatusProps['status'], string> = {
  idle: '',
  listening: 'Listening…',
  processing: 'Processing…',
  done: 'Done',
  error: "Couldn't understand that",
  unsupported: 'Microphone unavailable',
}

export function VoiceStatus({ status, transcript, message }: VoiceStatusProps) {
  if (status === 'idle') return null

  return (
    <div className={styles.status} role="status" aria-live="polite">
      <p className={styles.label}>{message ?? labels[status]}</p>
      {transcript && <p className={styles.transcript}>“{transcript}”</p>}
    </div>
  )
}
