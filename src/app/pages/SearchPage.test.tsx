import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocalRepository } from '@/repositories/localRepository'
import { AppShell } from '../AppShell'
import { SearchPage } from './SearchPage'

const mocks = vi.hoisted(() => ({
  search: vi.fn(),
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    isConfigured: false,
    isSignedIn: false,
    isLoading: false,
    repo: {
      search: mocks.search,
      deleteItem: vi.fn(),
    },
  }),
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

function renderSearchPage(initialEntry = '/search') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="search" element={<SearchPage />} />
          <Route index element={<div>Home page</div>} />
          <Route path="bins" element={<div>Bins page</div>} />
          <Route path="scan" element={<div>Scan page</div>} />
          <Route path="profile" element={<div>Profile page</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('SearchPage', () => {
  beforeEach(() => {
    mockMatchMedia(true)
    const repo = createLocalRepository()
    mocks.search.mockReset()
    mocks.search.mockImplementation((query: string) => repo.search(query))
  })

  it('keeps search results visible after searching from the search page', async () => {
    const user = userEvent.setup()
    renderSearchPage()

    await user.type(screen.getByRole('searchbox', { name: 'Search Trove' }), 'tool')
    await user.keyboard('{Enter}')

    expect(await screen.findByRole('heading', { name: 'Hammer' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Cordless drill' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Toolbox' })).toBeInTheDocument()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })

    expect(screen.getByRole('heading', { name: 'Hammer' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Search' })).toHaveLength(1)
    expect(mocks.search).toHaveBeenCalledTimes(1)
  })

  it('loads results from the query string without remounting into a blank state', async () => {
    renderSearchPage('/search?q=tool')

    expect(await screen.findByRole('heading', { name: 'Hammer' })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).toHaveValue('tool')

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150))
    })

    expect(screen.getByRole('heading', { name: 'Hammer' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Search' })).toHaveLength(1)
    expect(mocks.search).toHaveBeenCalledTimes(1)
  })
})
