import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoiceControl } from './VoiceControl'

const mocks = vi.hoisted(() => ({
  voice: {
    status: 'idle' as 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported',
    transcript: '',
    result: null as null | {
      kind: string
      message?: string
      binId?: string
      itemId?: string
      itemName?: string
      binName?: string
      query?: string
      candidates?: Array<{ id: string; name: string }>
    },
    listening: false,
    listen: vi.fn(),
    reset: vi.fn(),
    completeAddToBin: vi.fn(),
  },
  deleteItem: vi.fn(),
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    repo: {
      deleteItem: mocks.deleteItem,
    },
  }),
}))

vi.mock('@/features/voice/useVoiceCommand', () => ({
  useVoiceCommand: () => mocks.voice,
}))

describe('VoiceControl', () => {
  beforeEach(() => {
    mocks.voice.status = 'idle'
    mocks.voice.transcript = ''
    mocks.voice.result = null
    mocks.voice.listening = false
    mocks.voice.listen.mockReset()
    mocks.voice.reset.mockReset()
    mocks.voice.completeAddToBin.mockReset()
    mocks.deleteItem.mockReset()
  })

  it('shows a global mic with add-or-find hint', () => {
    render(
      <MemoryRouter>
        <VoiceControl />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Add or find with voice' })).toBeInTheDocument()
    expect(screen.getByText('Add items, find things, or open a bin')).toBeInTheDocument()
  })

  it('shows the added drawer after a unique voice add', () => {
    mocks.voice.status = 'done'
    mocks.voice.result = {
      kind: 'added_item',
      binId: 'bin-1',
      itemId: 'item-1',
      itemName: 'hammer',
      binName: 'Toolbox',
      message: 'Added hammer to Toolbox',
    }

    render(
      <MemoryRouter>
        <VoiceControl />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Added' })).toBeInTheDocument()
    expect(screen.getAllByText('Added hammer to Toolbox').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'View bin' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })
})
