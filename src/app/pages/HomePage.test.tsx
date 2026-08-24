import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HomePage } from './HomePage'

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
  refresh: vi.fn(),
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    isConfigured: false,
    isSignedIn: false,
    isLoading: false,
    repo: {
      listItems: mocks.listItems,
      createBin: mocks.createBin,
    },
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

vi.mock('@/features/voice/useVoiceCommand', () => ({
  useVoiceCommand: () => ({
    status: 'idle',
    transcript: '',
    result: null,
    listen: vi.fn(),
  }),
}))

describe('HomePage', () => {
  beforeEach(() => {
    mocks.bins = []
    mocks.listItems.mockReset()
    mocks.listItems.mockResolvedValue([])
    mocks.createBin.mockReset()
    mocks.refresh.mockReset()
  })

  it('hides the recent bins title when there are no bins', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('heading', { name: 'Recent bins' })).not.toBeInTheDocument()
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
  })
})
