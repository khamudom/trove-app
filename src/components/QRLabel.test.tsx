import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QRLabel } from './QRLabel'

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
  },
}))

describe('QRLabel', () => {
  it('renders a print target on document.body and disables print until the QR loads', async () => {
    render(<QRLabel binName="Toolbox" qrToken="qr-toolbox" />)

    const printButton = screen.getByRole('button', { name: 'Print label' })
    expect(printButton).toBeDisabled()

    await waitFor(() => {
      expect(printButton).toBeEnabled()
    })

    const printArea = document.body.querySelector('.print-area')
    expect(printArea).toBeTruthy()
    expect(printArea?.querySelector('img')).toBeTruthy()
    expect(screen.getAllByRole('img', { name: 'QR code for Toolbox' })).toHaveLength(2)
  })
})
