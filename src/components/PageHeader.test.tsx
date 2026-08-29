import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { PageHeader } from './PageHeader'
import styles from './PageHeader.module.css'

describe('PageHeader', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    })
  })

  it('compacts after the page is scrolled', () => {
    render(<PageHeader title="Trove" large />)
    const header = screen.getByRole('banner')

    expect(header).not.toHaveClass(styles.compact)

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 25,
    })
    fireEvent.scroll(window)

    expect(header).toHaveClass(styles.compact)
  })

  it('returns to full size near the top of the page', () => {
    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 100,
    })
    render(<PageHeader title="Bins" />)
    const header = screen.getByRole('banner')

    expect(header).toHaveClass(styles.compact)

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 0,
    })
    fireEvent.scroll(window)

    expect(header).not.toHaveClass(styles.compact)
  })
})
