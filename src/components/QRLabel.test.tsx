import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { QRLabel } from './QRLabel'

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
  },
}))

describe('QRLabel', () => {
  it('renders the printable label and disables print until the QR loads', async () => {
    render(<QRLabel binName="Toolbox" qrToken="qr-toolbox" />)

    const printButton = screen.getByRole('button', { name: 'Print label' })
    expect(printButton).toBeDisabled()

    await waitFor(() => {
      expect(printButton).toBeEnabled()
    })

    const printArea = document.querySelector('.print-area')
    expect(printArea).toBeTruthy()
    expect(printArea?.querySelector('img')).toBeTruthy()
    expect(screen.getByRole('img', { name: 'QR code for Toolbox' })).toBeInTheDocument()
  })
})
