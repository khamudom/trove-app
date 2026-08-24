import { useEffect, useRef } from 'react'
import { Icons } from './Icons'
import styles from './Sheet.module.css'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
}

export function Sheet({ open, title, onClose, children }: SheetProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="sheet-title" className={styles.title}>{title}</h2>
          <button ref={closeRef} type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <Icons.Close aria-hidden />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  )
}
