import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SearchField } from './SearchField'

describe('SearchField', () => {
  it('focuses without scrolling when autoFocus is set', () => {
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')

    render(<SearchField value="" onChange={() => undefined} autoFocus />)

    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).toHaveFocus()
    expect(focus).toHaveBeenCalledWith({ preventScroll: true })

    focus.mockRestore()
  })

  it('does not focus when autoFocus is unset', () => {
    render(<SearchField value="" onChange={() => undefined} />)

    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).not.toHaveFocus()
  })
})
