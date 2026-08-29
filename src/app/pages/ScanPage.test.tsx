import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScanPage } from './ScanPage'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('ScanPage', () => {
  const originalMediaDevices = navigator.mediaDevices
  const originalIsSecureContext = window.isSecureContext

  beforeEach(() => {
    navigate.mockReset()
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true })
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    })
    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: originalIsSecureContext,
    })
    vi.unstubAllGlobals()
  })

  it('opens the in-app camera without requiring BarcodeDetector', async () => {
    const trackStop = vi.fn()
    const stream = {
      getTracks: () => [{ stop: trackStop }],
    } as unknown as MediaStream

    const getUserMedia = vi.fn().mockResolvedValue(stream)
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    render(
      <MemoryRouter>
        <ScanPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Scan' })).toBeInTheDocument()
    expect(screen.getByText(/Starting camera/i)).toBeInTheDocument()

    await waitFor(() => {
      expect(getUserMedia).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText(/Align a Trove QR label/i)).toBeInTheDocument()
    })

    expect(screen.queryByRole('heading', { name: 'Camera unavailable' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Use your phone camera' })).not.toBeInTheDocument()
  })

  it('shows a retry path when camera permission is denied', async () => {
    const user = userEvent.setup()
    const getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'))
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    })

    render(
      <MemoryRouter>
        <ScanPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Camera unavailable' })).toBeInTheDocument()
    expect(screen.getByText(/Camera permission is required/i)).toBeInTheDocument()

    getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: vi.fn() }],
    } as unknown as MediaStream)
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)

    await user.click(screen.getByRole('button', { name: 'Try camera again' }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Scan' })).toBeInTheDocument()
    })
  })

  it('falls back when getUserMedia is unavailable', async () => {
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })

    render(
      <MemoryRouter>
        <ScanPage />
      </MemoryRouter>,
    )

    expect(await screen.findByRole('heading', { name: 'Camera unavailable' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Browse bins' })).toBeInTheDocument()
  })

  it('returns to search when the scanner is closed', async () => {
    const user = userEvent.setup()
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: false })
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    })

    render(
      <MemoryRouter>
        <ScanPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Close scanner' }))

    expect(navigate).toHaveBeenCalledWith('/search')
  })
})
