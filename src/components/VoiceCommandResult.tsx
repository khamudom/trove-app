import { useNavigate } from 'react-router-dom'
import { Button, Drawer } from '@khamudom/lumen-ui-react'
import type { Bin } from '@/types'
import type { VoiceActionResult } from '@/features/voice/useVoiceCommand'
import styles from './VoiceCommandResult.module.css'

interface VoiceCommandResultProps {
  result: VoiceActionResult | null
  onCompleteAdd: (bin: Bin, itemName?: string) => void
  onUndo: (itemId: string) => Promise<void>
  onReset: () => void
}

export function VoiceCommandResult({ result, onCompleteAdd, onUndo, onReset }: VoiceCommandResultProps) {
  const navigate = useNavigate()

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

      {result.kind === 'added_item' && result.binId && (
        <Drawer
          open
          heading="Added"
          right
          onOpenChange={(open) => {
            if (!open) onReset()
          }}
        >
          <p>{result.message}</p>
          <div className={styles.sheetActions}>
            <Button onClick={() => navigate(`/bins/${result.binId}`)}>View bin</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (result.itemId) await onUndo(result.itemId)
                onReset()
              }}
            >
              Undo
            </Button>
          </div>
        </Drawer>
      )}
    </>
  )
}
