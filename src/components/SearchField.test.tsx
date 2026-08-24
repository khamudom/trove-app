import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('SearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('focuses immediately without scrolling on desktop when autoFocus is set', () => {
    mockMatchMedia(false)
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')

    render(<SearchField value="" onChange={() => undefined} autoFocus />)
    vi.runAllTimers()

    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).toHaveFocus()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })

    focus.mockRestore()
  })

  it('delays autofocus on mobile until after the page slide transition', () => {
    mockMatchMedia(true)
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')

    render(<SearchField value="" onChange={() => undefined} autoFocus />)

    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).not.toHaveFocus()

    vi.advanceTimersByTime(279)
    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).not.toHaveFocus()

    vi.advanceTimersByTime(1)
    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).toHaveFocus()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })

    focus.mockRestore()
  })

  it('does not focus when autoFocus is unset', () => {
    mockMatchMedia(false)
    render(<SearchField value="" onChange={() => undefined} />)
    vi.runAllTimers()

    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).not.toHaveFocus()
  })
})
