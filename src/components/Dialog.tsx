import { useEffect } from 'react'
import { Button } from './Button'
import styles from './Dialog.module.css'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function Dialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className={styles.overlay} role="presentation" onClick={onCancel}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? 'dialog-description' : undefined}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="dialog-title" className={styles.title}>{title}</h2>
        {description && <p id="dialog-description" className={styles.description}>{description}</p>}
        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={onCancel}>{cancelLabel}</button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  )
}
