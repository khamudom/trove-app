import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Button, Toast } from '@khamudom/lumen-ui-react'
import type { Bin } from '@/types'
import type { VoiceActionResult } from '@/features/voice/useVoiceCommand'
import styles from './VoiceCommandResult.module.css'

const ADDED_TOAST_DURATION_MS = 4000

interface VoiceCommandResultProps {
  result: VoiceActionResult | null
  onCompleteAdd: (bin: Bin, itemName?: string) => void
  onUndo: (itemId: string) => Promise<void>
  onReset: () => void
}

export function VoiceCommandResult({ result, onCompleteAdd, onUndo, onReset }: VoiceCommandResultProps) {
  const navigate = useNavigate()

  useEffect(() => {
    if (result?.kind !== 'added_item') return
    const timer = window.setTimeout(() => onReset(), ADDED_TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [result, onReset])

  if (!result) return null

  return (
    <>
      {result.kind === 'confirm_bin' && result.candidates && (
        <div className={styles.choices}>
          <p>{result.message}</p>
          {result.candidates.map((bin) => (
            <Button
              key={bin.id}
              variant="secondary"
              onClick={() => {
                if (result.itemName) onCompleteAdd(bin, result.itemName)
                else navigate(`/bins/${bin.id}`)
              }}
            >
              {bin.name}
            </Button>
          ))}
        </div>
      )}

      {result.kind === 'added_item' &&
        createPortal(
          <div className={styles.toastBar} role="status" aria-live="polite">
            <Toast
              title="Item added."
              action={(
                <Button
                  variant="ghost"
                  onClick={async () => {
                    if (result.itemId) await onUndo(result.itemId)
                    onReset()
                  }}
                >
                  Undo
                </Button>
              )}
              onClose={onReset}
            />
          </div>,
          document.body,
        )}
    </>
  )
}
