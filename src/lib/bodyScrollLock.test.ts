import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  lockBodyScroll,
  observeOverlayBodyScrollLock,
  resetBodyScrollLockForTests,
  syncBodyScrollLockToOverlays,
  unlockBodyScroll,
} from './bodyScrollLock'

describe('bodyScrollLock', () => {
  afterEach(() => {
    document.body.replaceChildren()
    resetBodyScrollLockForTests()
    vi.unstubAllGlobals()
  })

  it('locks and restores body overflow', () => {
    document.body.style.overflow = 'auto'

    const release = lockBodyScroll()
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.documentElement.style.overflow).toBe('hidden')

    release()
    expect(document.body.style.overflow).toBe('auto')
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('supports nested locks with a single restore', () => {
    const first = lockBodyScroll()
    const second = lockBodyScroll()

    expect(document.body.style.overflow).toBe('hidden')

    first()
    expect(document.body.style.overflow).toBe('hidden')

    second()
    expect(document.body.style.overflow).toBe('')
  })

  it('syncs lock state from overlay portals', () => {
    syncBodyScrollLockToOverlays()
    expect(document.body.style.overflow).toBe('')

    const portal = document.createElement('div')
    portal.className = 'lumen-dialog__portal'
    document.body.append(portal)

    syncBodyScrollLockToOverlays()
    expect(document.body.style.overflow).toBe('hidden')

    portal.remove()
    syncBodyScrollLockToOverlays()
    expect(document.body.style.overflow).toBe('')
  })

  it('observes portal mount and unmount', async () => {
    const stop = observeOverlayBodyScrollLock()

    const portal = document.createElement('div')
    portal.className = 'lumen-drawer__portal'
    document.body.append(portal)
    await vi.waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden')
    })

    portal.remove()
    await vi.waitFor(() => {
      expect(document.body.style.overflow).toBe('')
    })

    stop()
  })

  it('unlocks when the observer is stopped while locked', () => {
    const portal = document.createElement('div')
    portal.className = 'lumen-alert-dialog__portal'
    document.body.append(portal)

    const stop = observeOverlayBodyScrollLock()
    expect(document.body.style.overflow).toBe('hidden')

    stop()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('unlockBodyScroll without lock', () => {
  afterEach(() => {
    resetBodyScrollLockForTests()
  })

  it('is a no-op', () => {
    expect(() => unlockBodyScroll()).not.toThrow()
  })
})
