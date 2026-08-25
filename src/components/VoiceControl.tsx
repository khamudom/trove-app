import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icons } from '@/components/Icons'
import { VoiceCommandResult } from '@/components/VoiceCommandResult'
import { VoiceStatus } from '@/components/VoiceStatus'
import { useAuth } from '@/features/auth/AuthContext'
import { useVoiceCommand } from '@/features/voice/useVoiceCommand'
import { notifyInventoryChanged } from '@/lib/inventoryEvents'
import styles from './VoiceControl.module.css'

export function VoiceControl() {
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

  const micClass = [styles.mic, listening ? styles.micListening : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.root}>
      <div className={styles.panel}>
        <VoiceStatus status={status} transcript={transcript} message={result?.message} />

        <VoiceCommandResult
          result={result}
          onCompleteAdd={(bin, itemName) => void completeAddToBin(bin, itemName)}
          onUndo={async (itemId) => {
            await repo.deleteItem(itemId)
            notifyInventoryChanged()
          }}
          onReset={reset}
        />
      </div>

      <div className={styles.fab}>
        <button
          type="button"
          className={micClass}
          aria-label="Add or find with voice"
          aria-pressed={listening}
          onClick={() => void listen()}
        >
          <Icons.Mic className={styles.micIcon} />
        </button>
        <p className={styles.hint}>
          {listening ? 'Listening…' : 'Add items, find things, or open a bin'}
        </p>
      </div>
    </div>
  )
}
