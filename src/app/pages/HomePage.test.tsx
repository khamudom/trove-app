import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'
import {
  GUEST_SECOND_BIN_DESCRIPTION,
  GUEST_SECOND_BIN_TITLE,
} from '@/features/auth/guestBinLimit'

const mocks = vi.hoisted(() => ({
  bins: [] as Array<{
    id: string
    name: string
    category?: string
    tags: string[]
    location?: string
    createdAt: string
    updatedAt: string
  }>,
  listItems: vi.fn(),
  createBin: vi.fn(),
  deleteItem: vi.fn(),
  refresh: vi.fn(),
  signUp: vi.fn(),
  isSignedIn: false,
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    isConfigured: true,
    isSignedIn: mocks.isSignedIn,
    isLoading: false,
    repo: {
      listItems: mocks.listItems,
      createBin: mocks.createBin,
      deleteItem: mocks.deleteItem,
    },
    signIn: vi.fn(),
    signUp: mocks.signUp,
  }),
}))

vi.mock('@/hooks/useBins', () => ({
  useBins: () => ({
    bins: mocks.bins,
    loading: false,
    refresh: mocks.refresh,
  }),
}))

vi.mock('@/repositories/localRepository', () => ({
  getRecentBinIds: () => [],
}))

describe('HomePage', () => {
  beforeEach(() => {
    mocks.bins = []
    mocks.isSignedIn = false
    mocks.listItems.mockReset()
    mocks.listItems.mockResolvedValue([])
    mocks.createBin.mockReset()
    mocks.deleteItem.mockReset()
    mocks.refresh.mockReset()
    mocks.signUp.mockReset()
  })

  it('hides the recent bins title when there are no bins', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('heading', { name: 'Recent bins' })).not.toBeInTheDocument()
  })

  it('introduces new users to Trove', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Everything you own. Right where you left it.' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'How Trove works' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create your first bin' })).toBeInTheDocument()
  })

  it('shows the recent bins title when bins exist', () => {
    mocks.bins = [
      {
        id: 'bin-1',
        name: 'Toolbox',
        tags: [],
        location: 'Garage',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Recent bins' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Toolbox' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Everything you own. Right where you left it.' }),
    ).not.toBeInTheDocument()
  })

  it('hides inventory shortcuts for signed-out users with no bins', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('button', { name: 'Add bin' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'All bins' })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
    expect(screen.queryByText('Know what you own. Know where it lives.')).not.toBeInTheDocument()
  })

  it('starts the first bin from the welcome panel', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Create your first bin' }))
    expect(screen.getByRole('heading', { name: 'Create bin' })).toBeInTheDocument()
  })

  it('prompts guests to keep building when they already have a bin', async () => {
    const user = userEvent.setup()
    mocks.bins = [
      {
        id: 'bin-1',
        name: 'Toolbox',
        tags: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    expect(screen.getByRole('heading', { name: GUEST_SECOND_BIN_TITLE })).toBeInTheDocument()
    expect(screen.getByText(GUEST_SECOND_BIN_DESCRIPTION)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Already have an account? Sign in' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Create bin' })).not.toBeInTheDocument()
  })

  it('resumes create bin after the guest account gate succeeds', async () => {
    const user = userEvent.setup()
    mocks.signUp.mockResolvedValue({ needsConfirmation: false })
    mocks.bins = [
      {
        id: 'bin-1',
        name: 'Toolbox',
        tags: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    await user.type(screen.getByLabelText(/email/i), 'you@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(mocks.signUp).toHaveBeenCalledWith('you@example.com', 'secret1')
    expect(await screen.findByRole('heading', { name: 'Create bin' })).toBeInTheDocument()
  })

  it('lets signed-in users create another bin', async () => {
    const user = userEvent.setup()
    mocks.isSignedIn = true
    mocks.bins = [
      {
        id: 'bin-1',
        name: 'Toolbox',
        tags: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Add bin' }))
    expect(screen.getByRole('heading', { name: 'Create bin' })).toBeInTheDocument()
  })
})
