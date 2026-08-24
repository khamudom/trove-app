import { Banner, BannerDescription, BannerTitle } from '@khamudom/lumen-ui-react'

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

  const variant = status === 'error' || status === 'unsupported'
    ? 'danger'
    : status === 'done'
      ? 'success'
      : 'default'

  return (
    <Banner variant={variant}>
      <BannerTitle>{message ?? labels[status]}</BannerTitle>
      {transcript && <BannerDescription>“{transcript}”</BannerDescription>}
    </Banner>
  )
}
