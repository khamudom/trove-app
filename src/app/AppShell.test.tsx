import { Suspense, lazy, useEffect, type ReactElement } from 'react'
import { Link, MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchField } from '@/components/SearchField'
import { AppShell } from './AppShell'
import styles from './AppShell.module.css'

vi.mock('@/components/VoiceControl', () => ({
  VoiceControl: () => null,
}))

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

function renderShell(
  lazyBins = false,
  options?: {
    initialEntry?: string
    searchPage?: () => ReactElement
    binsPage?: () => ReactElement
    binDetailPage?: () => ReactElement
  },
) {
  let resolveBins: ((value: { default: () => ReactElement }) => void) | undefined
  const BinsPage = lazyBins
    ? lazy(
        () =>
          new Promise<{ default: () => ReactElement }>((resolve) => {
            resolveBins = resolve
          }),
      )
    : (options?.binsPage ?? (() => <div>Bins page</div>))
  const SearchPage = options?.searchPage ?? (() => <div>Search page</div>)
  const BinDetailPage = options?.binDetailPage ?? (() => <div>Bin detail page</div>)

  const view = render(
    <MemoryRouter initialEntries={[options?.initialEntry ?? '/']}>
      <Suspense fallback={<p>App loading</p>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>Home page</div>} />
            <Route path="bins" element={<BinsPage />} />
            <Route path="bins/:binId" element={<BinDetailPage />} />
            <Route path="scan" element={<div>Scan page</div>} />
            <Route path="search" element={<SearchPage />} />
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
    const { nav } = renderShell(false, {
      searchPage: () => (
        <div>
          Search page
          <SearchField value="" onChange={() => undefined} autoFocus />
        </div>
      ),
    })

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

  it('does not remount the current page when only the query string changes', async () => {
    const user = userEvent.setup()
    let mounts = 0

    function SearchProbe() {
      const [params, setParams] = useSearchParams()
      useEffect(() => {
        mounts += 1
      }, [])

      return (
        <div>
          <div>Search page</div>
          <div>query:{params.get('q') ?? ''}</div>
          <button type="button" onClick={() => setParams({ q: 'tool' })}>
            Apply query
          </button>
        </div>
      )
    }

    renderShell(false, { initialEntry: '/search', searchPage: SearchProbe })

    expect(screen.getByText('Search page')).toBeInTheDocument()
    expect(mounts).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Apply query' }))

    expect(screen.getByText('query:tool')).toBeInTheDocument()
    expect(screen.getByText('Search page')).toBeInTheDocument()
    expect(document.querySelector(`.${styles.enterFromRight}`)).toBeNull()
    expect(mounts).toBe(1)
  })

  it('slides bin detail in from the right when opening from all bins', async () => {
    const user = userEvent.setup()
    renderShell(false, {
      initialEntry: '/bins',
      binsPage: () => (
        <div>
          Bins page
          <Link to="/bins/bin-1">Open bin</Link>
        </div>
      ),
    })

    await user.click(screen.getByRole('link', { name: 'Open bin' }))

    expect(document.querySelector(`.${styles.enterFromRight}`)).toBeTruthy()
    expect(document.querySelector(`.${styles.exitToLeft}`)).toBeTruthy()
    expect(screen.getByText('Bin detail page')).toBeInTheDocument()
    expect(screen.getByText('Bins page')).toBeInTheDocument()
  })

  it('slides all bins in from the left when leaving bin detail', async () => {
    const user = userEvent.setup()
    renderShell(false, {
      initialEntry: '/bins/bin-1',
      binsPage: () => <div>Bins page</div>,
      binDetailPage: () => (
        <div>
          Bin detail page
          <Link to="/bins">Back to bins</Link>
        </div>
      ),
    })

    await user.click(screen.getByRole('link', { name: 'Back to bins' }))

    expect(document.querySelector(`.${styles.enterFromLeft}`)).toBeTruthy()
    expect(document.querySelector(`.${styles.exitToRight}`)).toBeTruthy()
    expect(screen.getByText('Bins page')).toBeInTheDocument()
    expect(screen.getByText('Bin detail page')).toBeInTheDocument()
  })
})
