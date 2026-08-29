import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
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

function ControlledSearchField({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue)
  return <SearchField value={value} onChange={setValue} />
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

  it('disables submit when empty and shows clear while editing a value', () => {
    mockMatchMedia(false)
    const onChange = vi.fn()
    const onSubmit = vi.fn()
    const { rerender } = render(
      <SearchField value="" onChange={onChange} onSubmit={onSubmit} />,
    )

    expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled()

    rerender(<SearchField value="bow ties" onChange={onChange} onSubmit={onSubmit} />)
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeEnabled()

    const input = screen.getByRole('searchbox', { name: 'Search Trove' })
    fireEvent.focus(input)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))

    expect(onChange).toHaveBeenCalledWith('')
    expect(input).toHaveFocus()
  })

  it('keeps mobile input focused while clearing', () => {
    mockMatchMedia(true)
    render(<ControlledSearchField initialValue="Document" />)

    const input = screen.getByRole('searchbox', { name: 'Search Trove' })
    fireEvent.focus(input)
    const clearButton = screen.getByRole('button', { name: 'Clear search' })

    fireEvent.pointerDown(clearButton)
    expect(input).toHaveFocus()
    expect(input).toHaveValue('Document')

    fireEvent.click(clearButton)

    expect(input).toHaveValue('')
    expect(input).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled()
  })

  it('does not submit whitespace-only values', () => {
    mockMatchMedia(false)
    const onSubmit = vi.fn()
    render(<SearchField value="   " onChange={() => undefined} onSubmit={onSubmit} />)

    fireEvent.submit(screen.getByRole('search'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Submit search' })).toBeDisabled()
  })
})
