import { Suspense, lazy, type ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchField } from '@/components/SearchField'
import { AppShell } from './AppShell'
import styles from './AppShell.module.css'

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

function renderShell(lazyBins = false) {
  let resolveBins: ((value: { default: () => ReactElement }) => void) | undefined
  const BinsPage = lazyBins
    ? lazy(
        () =>
          new Promise<{ default: () => ReactElement }>((resolve) => {
            resolveBins = resolve
          }),
      )
    : () => <div>Bins page</div>

  const view = render(
    <MemoryRouter initialEntries={['/']}>
      <Suspense fallback={<p>App loading</p>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>Home page</div>} />
            <Route path="bins" element={<BinsPage />} />
            <Route path="scan" element={<div>Scan page</div>} />
            <Route
              path="search"
              element={
                <div>
                  Search page
                  <SearchField value="" onChange={() => undefined} autoFocus />
                </div>
              }
            />
            <Route path="profile" element={<div>Profile page</div>} />
          </Route>
        </Routes>
      </Suspense>
    </MemoryRouter>,
  )

  return {
    ...view,
    loadBins: () => resolveBins?.({ default: () => <div>Bins page</div> }),
    nav: () => screen.getByRole('navigation', { name: 'Primary' }),
  }
}

describe('AppShell mobile page transitions', () => {
  beforeEach(() => {
    mockMatchMedia(true)
  })

  it('slides the first visit in from the right', async () => {
    const user = userEvent.setup()
    const { nav } = renderShell()

    expect(screen.getByText('Home page')).toBeInTheDocument()
    await user.click(within(nav()).getByRole('link', { name: 'Bins' }))

    expect(document.querySelector(`.${styles.enterFromRight}`)).toBeTruthy()
    expect(document.querySelector(`.${styles.exitToLeft}`)).toBeTruthy()
    expect(screen.getByText('Bins page')).toBeInTheDocument()
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('slides the first visit in from the left', async () => {
    const user = userEvent.setup()
    const { nav } = renderShell()

    await user.click(within(nav()).getByRole('link', { name: 'Search' }))
    expect(screen.getByText('Search page')).toBeInTheDocument()

    await user.click(within(nav()).getByRole('link', { name: 'Home' }))

    expect(document.querySelector(`.${styles.enterFromLeft}`)).toBeTruthy()
    expect(document.querySelector(`.${styles.exitToRight}`)).toBeTruthy()
  })

  it('slides search in from the right on the first visit', async () => {
    const user = userEvent.setup()
    const { nav } = renderShell()

    await user.click(within(nav()).getByRole('link', { name: 'Search' }))

    expect(document.querySelector(`.${styles.enterFromRight}`)).toBeTruthy()
    expect(document.querySelector(`.${styles.exitToLeft}`)).toBeTruthy()
    expect(screen.getByText('Search page')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).toBeInTheDocument()
  })

  it('animates the first visit to a page that is still loading', async () => {
    const user = userEvent.setup()
    const { nav } = renderShell(true)

    await user.click(within(nav()).getByRole('link', { name: 'Bins' }))

    expect(screen.queryByText('App loading')).not.toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(document.querySelector(`.${styles.enterFromRight}`)).toBeTruthy()
    expect(screen.getByText('Home page')).toBeInTheDocument()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('does not animate tab changes on desktop', async () => {
    mockMatchMedia(false)
    const user = userEvent.setup()
    const { nav } = renderShell()

    await user.click(within(nav()).getByRole('link', { name: 'Bins' }))

    expect(document.querySelector(`.${styles.enterFromRight}`)).toBeNull()
    expect(screen.getByText('Bins page')).toBeInTheDocument()
    expect(screen.queryByText('Home page')).not.toBeInTheDocument()
  })
})
