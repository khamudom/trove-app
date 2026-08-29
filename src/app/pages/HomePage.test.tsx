import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'
import {
  GUEST_SECOND_BIN_DESCRIPTION,
  GUEST_SECOND_BIN_TITLE,
} from '@/features/auth/guestBinLimit'

const mocks = vi.hoisted(() => {
  const listItems = vi.fn()
  const createBin = vi.fn()
  const deleteItem = vi.fn()
  const updateItem = vi.fn()

  return {
    bins: [] as Array<{
      id: string
      name: string
      category?: string
      tags: string[]
      location?: string
      createdAt: string
      updatedAt: string
    }>,
    listItems,
    createBin,
    deleteItem,
    updateItem,
    repo: { listItems, createBin, deleteItem, updateItem },
    refresh: vi.fn(),
    signUp: vi.fn(),
    isSignedIn: false,
    loading: false,
    userEmail: undefined as string | undefined,
    displayName: undefined as string | undefined,
  }
})

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    isConfigured: true,
    isSignedIn: mocks.isSignedIn,
    isLoading: false,
    userEmail: mocks.userEmail,
    displayName: mocks.displayName,
    repo: mocks.repo,
    signIn: vi.fn(),
    signUp: mocks.signUp,
  }),
}))

vi.mock('@/hooks/useBins', () => ({
  useBins: () => ({
    bins: mocks.bins,
    loading: mocks.loading,
    refresh: mocks.refresh,
  }),
}))

vi.mock('@/repositories/localRepository', () => ({
  getRecentBinIds: () => [],
}))

function CurrentLocation() {
  const location = useLocation()
  return <span data-testid="current-location">{location.pathname}{location.search}</span>
}

describe('HomePage', () => {
  beforeEach(() => {
    mocks.bins = []
    mocks.isSignedIn = false
    mocks.loading = false
    mocks.userEmail = undefined
    mocks.displayName = undefined
    mocks.listItems.mockReset()
    mocks.listItems.mockResolvedValue([])
    mocks.createBin.mockReset()
    mocks.deleteItem.mockReset()
    mocks.updateItem.mockReset()
    mocks.updateItem.mockResolvedValue({})
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

  it('does not show the empty welcome state while signed-in bins are loading', () => {
    mocks.isSignedIn = true
    mocks.loading = true

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Trove' })).toBeInTheDocument()
    expect(screen.queryByText('Know what you own. Know where it lives.')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Everything you own. Right where you left it.' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
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
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('shows two recent bins with the add action in the section header', () => {
    mocks.bins = [
      {
        id: 'bin-1',
        name: 'Toolbox',
        tags: [],
        createdAt: '2026-01-03T00:00:00.000Z',
        updatedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        id: 'bin-2',
        name: 'Camping gear',
        tags: [],
        createdAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        id: 'bin-3',
        name: 'Holiday decor',
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

    const recentBinsHeading = screen.getByRole('heading', { name: 'Recent bins' })
    const addBinButton = screen.getByRole('button', { name: 'Add bin' })

    expect(addBinButton.parentElement).toBe(recentBinsHeading.parentElement)
    expect(screen.getByRole('heading', { name: 'Toolbox' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Camping gear' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Holiday decor' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'All bins' })).not.toBeInTheDocument()
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
    mocks.userEmail = 'sam@example.com'
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

    await user.click(await screen.findByRole('button', { name: 'Add bin' }))
    expect(screen.getByRole('heading', { name: 'Create bin' })).toBeInTheDocument()
  })

  it('personalizes the signed-in home from account inventory', async () => {
    mocks.isSignedIn = true
    mocks.displayName = 'Sam'
    mocks.userEmail = 'sam@example.com'
    mocks.bins = [
      {
        id: 'camera',
        name: 'Camera Gear',
        tags: [],
        location: 'Hall closet',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-01T00:00:00.000Z',
      },
      {
        id: 'bin-2',
        name: 'Bin2',
        tags: [],
        location: 'Garage',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-20T00:00:00.000Z',
      },
      {
        id: 'holiday',
        name: 'Holiday',
        tags: [],
        location: 'Attic',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ]
    mocks.listItems.mockImplementation(async (binId: string) => {
      if (binId === 'camera') {
        return [
          {
            id: 'sx70',
            binId: 'camera',
            name: 'Polaroid SX-70',
            tags: [],
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-06-27T00:00:00.000Z',
          },
        ]
      }
      if (binId === 'bin-2') {
        return [
          {
            id: 'ladder',
            binId: 'bin-2',
            name: 'Ladder',
            description: 'Lent to Marcus',
            tags: ['lent'],
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-08-06T00:00:00.000Z',
          },
        ]
      }
      return Array.from({ length: 23 }, (_, index) => ({
        id: `ornament-${index}`,
        binId: 'holiday',
        name: `Ornament ${index + 1}`,
        tags: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      }))
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Trove' })).toBeInTheDocument()
    expect(screen.queryByText('Know what you own. Know where it lives.')).not.toBeInTheDocument()
    expect(await screen.findByText(/keeping track of/)).toBeInTheDocument()
    expect(screen.getByText('25 things', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('3 bins', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Search Trove' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'From the archive' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Polaroid SX-70' })).toBeInTheDocument()
    expect(screen.getByText('Bin2 has 1 item')).toBeInTheDocument()
    expect(screen.getByText('Ladder lent to Marcus')).toBeInTheDocument()
    expect(screen.getAllByText('Camera Gear').length).toBeGreaterThan(0)
    expect(screen.getByText('Holiday')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Everything you own. Right where you left it.' }),
    ).not.toBeInTheDocument()
  })

  it('opens home search results on the search page when submitted', async () => {
    const user = userEvent.setup()
    mocks.isSignedIn = true

    render(
      <MemoryRouter>
        <HomePage />
        <CurrentLocation />
      </MemoryRouter>,
    )

    const searchbox = await screen.findByRole('searchbox', { name: 'Search Trove' })
    await user.type(searchbox, '  bow ties  ')
    fireEvent.submit(searchbox.closest('form')!)

    expect(screen.getByTestId('current-location')).toHaveTextContent('/search?q=bow%20ties')
  })

  it('marks an archive item as still kept', async () => {
    const user = userEvent.setup()
    mocks.isSignedIn = true
    mocks.userEmail = 'sam@example.com'
    mocks.bins = [
      {
        id: 'camera',
        name: 'Camera Gear',
        tags: [],
        location: 'Hall closet',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-01T00:00:00.000Z',
      },
    ]
    mocks.listItems.mockResolvedValue([
      {
        id: 'sx70',
        binId: 'camera',
        name: 'Polaroid SX-70',
        tags: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-06-27T00:00:00.000Z',
      },
    ])

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    await user.click(await screen.findByRole('button', { name: 'Still keeping it' }))
    expect(mocks.updateItem).toHaveBeenCalledWith('sx70', {})
  })
})
