const OVERLAY_PORTAL_SELECTOR = [
  '.lumen-dialog__portal',
  '.lumen-drawer__portal',
  '.lumen-alert-dialog__portal',
].join(', ')

type ScrollLockSnapshot = {
  htmlOverflow: string
  bodyOverflow: string
  bodyPaddingRight: string
  scrollY: number
}

let lockCount = 0
let snapshot: ScrollLockSnapshot | null = null

function getScrollbarWidth() {
  return window.innerWidth - document.documentElement.clientWidth
}

export function lockBodyScroll() {
  if (typeof document === 'undefined') {
    return () => {}
  }

  if (lockCount === 0) {
    const { documentElement: html, body } = document
    snapshot = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyPaddingRight: body.style.paddingRight,
      scrollY: window.scrollY,
    }

    const scrollbarWidth = getScrollbarWidth()
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
    }
  }

  lockCount += 1

  return () => {
    unlockBodyScroll()
  }
}

export function unlockBodyScroll() {
  if (typeof document === 'undefined' || lockCount === 0) {
    return
  }

  lockCount -= 1
  if (lockCount > 0 || !snapshot) {
    return
  }

  const { documentElement: html, body } = document
  html.style.overflow = snapshot.htmlOverflow
  body.style.overflow = snapshot.bodyOverflow
  body.style.paddingRight = snapshot.bodyPaddingRight
  const scrollY = snapshot.scrollY
  snapshot = null
  if (typeof window.scrollTo === 'function') {
    window.scrollTo(0, scrollY)
  }
}

export function resetBodyScrollLockForTests() {
  lockCount = 0
  snapshot = null
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  document.body.style.paddingRight = ''
}

export function syncBodyScrollLockToOverlays() {
  if (typeof document === 'undefined') {
    return
  }

  const shouldLock = document.querySelector(OVERLAY_PORTAL_SELECTOR) !== null
  if (shouldLock && lockCount === 0) {
    lockBodyScroll()
    return
  }

  if (!shouldLock && lockCount > 0) {
    lockCount = 1
    unlockBodyScroll()
  }
}

export function observeOverlayBodyScrollLock() {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }

  const observer = new MutationObserver(() => {
    syncBodyScrollLockToOverlays()
  })

  observer.observe(document.body, { childList: true })
  syncBodyScrollLockToOverlays()

  return () => {
    observer.disconnect()
    if (lockCount > 0) {
      lockCount = 1
      unlockBodyScroll()
    }
  }
}

export { OVERLAY_PORTAL_SELECTOR }
