import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BinDetailPage } from './BinDetailPage'

const bin = {
  id: 'bin-1',
  name: 'Toolbox',
  description: 'Hand tools and power tools.',
  category: 'Tools',
  tags: ['tools', 'workshop'],
  location: 'Garage Workbench',
  qrToken: 'qr-toolbox',
  items: [
    {
      id: 'item-1',
      binId: 'bin-1',
      name: 'Cordless drill',
      tags: ['tool', 'power tool'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const mocks = vi.hoisted(() => ({
  isSignedIn: true,
  refresh: vi.fn(),
  repo: {
    getBin: vi.fn(),
    getBinWithItems: vi.fn(),
    createItem: vi.fn(),
    updateItem: vi.fn(),
    deleteItem: vi.fn(),
    updateBin: vi.fn(),
    deleteBin: vi.fn(),
  },
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    isConfigured: true,
    isLoading: false,
    isSignedIn: mocks.isSignedIn,
    repo: mocks.repo,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}))

vi.mock('@/hooks/useBins', () => ({
  useBinDetail: () => ({
    bin,
    loading: false,
    refresh: mocks.refresh,
  }),
}))

vi.mock('@/repositories/localRepository', () => ({
  trackRecentBin: vi.fn(),
}))

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,qr'),
  },
}))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/bins/bin-1']}>
      <Routes>
        <Route path="/bins/:binId" element={<BinDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BinDetailPage QR label', () => {
  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    document.body.innerHTML = ''
  })

  it('opens a dialog for the QR label and keeps it open', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'QR label' }))

    const heading = await screen.findByRole('heading', { name: 'Print QR label' })
    expect(heading).toBeInTheDocument()
    expect(document.querySelector('.lumen-dialog__portal')).toBeTruthy()
    expect(document.querySelector('.lumen-drawer__portal')).toBeNull()

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: 'Print QR label' })).toBeInTheDocument()
        expect(document.querySelector('.lumen-dialog__portal')).toBeTruthy()
      },
      { timeout: 400 },
    )
  })
})
