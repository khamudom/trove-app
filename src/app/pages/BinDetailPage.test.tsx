import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
    {
      id: 'item-2',
      binId: 'bin-1',
      name: 'Claw hammer',
      tags: ['tool'],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const destinationBin = {
  id: 'bin-2',
  name: 'Garage Shelf',
  tags: [],
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
    moveItem: vi.fn(),
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
  useBins: () => ({
    bins: [bin, destinationBin],
    loading: false,
    refresh: vi.fn(),
  }),
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
        <Route path="/bins" element={<div>All bins</div>} />
        <Route path="/bins/:binId" element={<BinDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('BinDetailPage back navigation', () => {
  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    document.body.innerHTML = ''
  })

  it('shows a back control that returns to all bins', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Back to bins' }))

    expect(screen.getByText('All bins')).toBeInTheDocument()
  })
})

describe('BinDetailPage move items', () => {
  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    mocks.repo.moveItem.mockReset()
    document.body.innerHTML = ''
  })

  it('selects and moves multiple items after choosing a bin and confirming', async () => {
    const user = userEvent.setup()
    mocks.repo.moveItem.mockImplementation(async (itemId: string) => ({
      ...bin.items.find((item) => item.id === itemId),
      binId: destinationBin.id,
    }))
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Move items' }))
    const firstItem = screen.getByRole('checkbox', { name: 'Select Cordless drill' })
    const secondItem = screen.getByRole('checkbox', { name: 'Select Claw hammer' })
    await user.click(firstItem)
    await user.click(secondItem)

    expect(firstItem).toBeChecked()
    expect(secondItem).toBeChecked()
    expect(screen.getByText('2 items selected')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Move selected' }))
    expect(await screen.findByRole('heading', { name: 'Move items' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: destinationBin.name }))

    expect(await screen.findByText('Move 2 items to "Garage Shelf"?')).toBeInTheDocument()
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Move' }))

    await waitFor(() => {
      expect(mocks.repo.moveItem).toHaveBeenCalledWith('item-1', 'bin-2')
      expect(mocks.repo.moveItem).toHaveBeenCalledWith('item-2', 'bin-2')
      expect(mocks.repo.moveItem).toHaveBeenCalledTimes(2)
      expect(mocks.refresh).toHaveBeenCalled()
    })
  })

  it('does not move selected items when confirmation is canceled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Move items' }))
    await user.click(screen.getByRole('checkbox', { name: 'Select Cordless drill' }))
    await user.click(screen.getByRole('button', { name: 'Move selected' }))
    await user.click(await screen.findByRole('button', { name: destinationBin.name }))
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(mocks.repo.moveItem).not.toHaveBeenCalled()
    expect(screen.queryByText('Move 1 item to "Garage Shelf"?')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select Cordless drill' })).toBeChecked()
  })
})

describe('BinDetailPage QR label', () => {
  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    mocks.repo.createItem.mockReset()
    mocks.repo.deleteItem.mockReset()
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

describe('BinDetailPage undo toast', () => {
  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    mocks.repo.createItem.mockReset()
    mocks.repo.deleteItem.mockReset()
    document.body.innerHTML = ''
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('closes the add item dialog and dismisses the undo toast after a few seconds', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    mocks.repo.createItem.mockResolvedValue({
      id: 'item-new',
      binId: 'bin-1',
      name: 'Hammer',
      tags: [],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    })

    renderPage()

    await user.click(screen.getByRole('button', { name: 'Add item' }))
    expect(await screen.findByRole('heading', { name: 'Add item' })).toBeInTheDocument()

    const nameField = await screen.findByRole('textbox', { name: /Name/ })
    await user.type(nameField, 'Hammer')
    await user.click(document.querySelector('.lumen-dialog button[type="submit"]') as HTMLButtonElement)

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Add item' })).not.toBeInTheDocument()
    })
    expect(await screen.findByText('Item added.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(4000)

    await waitFor(() => {
      expect(screen.queryByText('Item added.')).not.toBeInTheDocument()
    })
  })
})
