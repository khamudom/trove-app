import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SpeechService } from '@/features/voice/speechService'
import { ItemForm } from './ItemForm'

function createSpeechService(transcript: string): SpeechService {
  return {
    isSupported: () => true,
    listen: async (onResult) => {
      onResult({ transcript, isFinal: true })
      return transcript
    },
    stop: vi.fn(),
    cancel: vi.fn(),
  }
}

describe('ItemForm', () => {
  it('fills item details from structured voice input', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <ItemForm
        submitLabel="Add item"
        onSubmit={onSubmit}
        speechService={createSpeechService(
          'Add Superman comic book. Description is first edition. Tag it comic, collectible.',
        )}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Add with voice' }))

    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveValue('Superman comic book')
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('first edition')
    expect(screen.getByRole('textbox', { name: 'Tags' })).toHaveValue('comic, collectible')

    await user.click(screen.getByRole('button', { name: 'Add item' }))
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Superman comic book',
      description: 'first edition',
      image: undefined,
      tags: ['comic', 'collectible'],
    })
  })

  it('offers the rear camera for an item photo', () => {
    render(
      <ItemForm
        submitLabel="Add item"
        onSubmit={vi.fn()}
        speechService={createSpeechService('')}
      />,
    )

    const input = screen.getByLabelText('Take or choose item photo')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('capture', 'environment')
  })
})
