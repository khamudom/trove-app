import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Icons } from '@/components/Icons'
import { VoiceCommandResult } from '@/components/VoiceCommandResult'
import { VoiceStatus } from '@/components/VoiceStatus'
import { useAuth } from '@/features/auth/AuthContext'
import { useVoiceCommand } from '@/features/voice/useVoiceCommand'
import { notifyInventoryChanged } from '@/lib/inventoryEvents'
import styles from './VoiceControl.module.css'

const VOICE_STATUS_DISMISS_MS = 3000

export function VoiceControl({ placement = 'mobile' }: { placement?: 'mobile' | 'desktop' }) {
  const navigate = useNavigate()
  const { repo } = useAuth()
  const voice = useVoiceCommand(repo)
  const { result, reset, listen, listening, status, transcript, completeAddToBin } = voice

  useEffect(() => {
    if (result?.kind === 'search' && result.query) {
      navigate(`/search?q=${encodeURIComponent(result.query)}`)
      reset()
      return
    }
    if (result?.kind === 'navigate' && result.binId) {
      navigate(`/bins/${result.binId}`)
      reset()
    }
  }, [result, navigate, reset])

  useEffect(() => {
    if (result?.kind === 'added_item') notifyInventoryChanged()
  }, [result])

  useEffect(() => {
    const shouldDismiss =
      status === 'error' ||
      status === 'unsupported' ||
      result?.kind === 'message'

    if (!shouldDismiss) return

    const timer = window.setTimeout(() => reset(), VOICE_STATUS_DISMISS_MS)
    return () => window.clearTimeout(timer)
  }, [status, result, reset])

  const micClass = [
    styles.mic,
    placement === 'desktop' ? styles.micDesktop : styles.micMobile,
    listening ? styles.micListening : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      {createPortal(<div className={styles.panel}>
        {result?.kind !== 'added_item' && (
          <VoiceStatus status={status} transcript={transcript} message={result?.message} />
        )}

        <VoiceCommandResult
          result={result}
          onCompleteAdd={(bin, itemName) => void completeAddToBin(bin, itemName)}
          onUndo={async (itemId) => {
            await repo.deleteItem(itemId)
            notifyInventoryChanged()
          }}
          onReset={reset}
        />
      </div>, document.body)}
      <button
        type="button"
        className={micClass}
        aria-label="Add or find with voice"
        aria-pressed={listening}
        onClick={() => void listen()}
      >
        <Icons.Mic className={styles.micIcon} />
        <span>Voice</span>
      </button>
    </>
  )
}
