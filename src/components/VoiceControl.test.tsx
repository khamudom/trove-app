import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    stop: vi.fn(),
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
    mocks.voice.stop.mockReset()
    mocks.voice.reset.mockReset()
    mocks.voice.completeAddToBin.mockReset()
    mocks.deleteItem.mockReset()
  })

  it('shows a global mic', () => {
    render(
      <MemoryRouter>
        <VoiceControl />
      </MemoryRouter>,
    )

    expect(screen.getByRole('button', { name: 'Add or find with voice' })).toBeInTheDocument()
    expect(screen.queryByText('Add items, find things, or open a bin')).not.toBeInTheDocument()
  })

  it('stops listening when the voice button is pressed again', () => {
    mocks.voice.status = 'listening'
    mocks.voice.listening = true

    render(
      <MemoryRouter>
        <VoiceControl />
      </MemoryRouter>,
    )

    screen.getByRole('button', { name: 'Stop voice input' }).click()

    expect(mocks.voice.stop).toHaveBeenCalledOnce()
    expect(mocks.voice.listen).not.toHaveBeenCalled()
    expect(screen.getByText('Stop')).toBeInTheDocument()
  })

  it('shows an item-added toast after a unique voice add', () => {
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

    expect(screen.getByText('Item added.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Added' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'View bin' })).not.toBeInTheDocument()
    expect(document.querySelector('.lumen-drawer__portal')).toBeNull()
  })

  describe('status banner auto-dismiss', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('dismisses the could not understand banner after a couple of seconds', async () => {
      mocks.voice.status = 'done'
      mocks.voice.transcript = 'Where is my passport'
      mocks.voice.result = {
        kind: 'message',
        message: "Couldn't understand that",
      }

      render(
        <MemoryRouter>
          <VoiceControl />
        </MemoryRouter>,
      )

      expect(screen.getByText("Couldn't understand that")).toBeInTheDocument()
      expect(screen.getByText('“Where is my passport”')).toBeInTheDocument()
      expect(mocks.voice.reset).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(3000)

      expect(mocks.voice.reset).toHaveBeenCalled()
    })

    it('dismisses the listening error banner after a couple of seconds', async () => {
      mocks.voice.status = 'error'
      mocks.voice.transcript = 'Where is my passport'

      render(
        <MemoryRouter>
          <VoiceControl />
        </MemoryRouter>,
      )

      expect(screen.getByText("Couldn't understand that")).toBeInTheDocument()
      expect(mocks.voice.reset).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(3000)

      expect(mocks.voice.reset).toHaveBeenCalled()
    })

    it('dismisses the item-added toast after a few seconds', async () => {
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

      expect(screen.getByText('Item added.')).toBeInTheDocument()
      expect(mocks.voice.reset).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(4000)

      expect(mocks.voice.reset).toHaveBeenCalled()
    })
  })
})
