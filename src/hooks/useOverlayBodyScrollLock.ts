import { useEffect } from 'react'
import { observeOverlayBodyScrollLock } from '@/lib/bodyScrollLock'

/** Locks document scrolling while a Lumen dialog, drawer, or alert dialog is open. */
export function useOverlayBodyScrollLock() {
  useEffect(() => observeOverlayBodyScrollLock(), [])
}
