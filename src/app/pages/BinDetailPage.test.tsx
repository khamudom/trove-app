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
  prepareItemImage: vi.fn(),
  extractItemFromImage: vi.fn(),
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

vi.mock('@/features/items/prepareItemImage', () => ({
  prepareItemImage: mocks.prepareItemImage,
}))

vi.mock('@/features/items/extractItemFromImage', () => ({
  extractItemFromImage: mocks.extractItemFromImage,
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
    expect(await screen.findByRole('heading', { name: 'Move selected items' })).toBeInTheDocument()
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
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))

    expect(mocks.repo.moveItem).not.toHaveBeenCalled()
    expect(screen.queryByText('Move 1 item to "Garage Shelf"?')).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select Cordless drill' })).toBeChecked()
  })
})

function itemCard(name: string) {
  const heading = screen.getByRole('heading', { name })
  const card = heading.closest('.lumen-card')
  if (!(card instanceof HTMLElement)) throw new Error(`Missing card for ${name}`)
  return card
}

describe('BinDetailPage delete item', () => {
  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    mocks.repo.deleteItem.mockReset()
    document.body.innerHTML = ''
  })

  it('removes the item immediately and keeps the rest of the page', async () => {
    const user = userEvent.setup()
    let resolveDelete: () => void = () => {}
    mocks.repo.deleteItem.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveDelete = resolve
      }),
    )
    renderPage()

    await user.click(within(itemCard('Cordless drill')).getByRole('button', { name: 'Delete' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete item' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Cordless drill' })).not.toBeInTheDocument()
    })
    expect(screen.getByRole('heading', { name: 'Toolbox' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Claw hammer' })).toBeInTheDocument()
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
    expect(mocks.refresh).not.toHaveBeenCalled()
    expect(mocks.repo.deleteItem).toHaveBeenCalledWith('item-1')

    resolveDelete()
    await waitFor(() => {
      expect(mocks.refresh).toHaveBeenCalledWith({ background: true })
    })
    expect(screen.queryByRole('heading', { name: 'Cordless drill' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Toolbox' })).toBeInTheDocument()
    expect(screen.queryByText('Loading…')).not.toBeInTheDocument()
  })

  it('leaves the item in the bin when deletion fails', async () => {
    const user = userEvent.setup()
    let rejectDelete: (error: Error) => void = () => {}
    mocks.repo.deleteItem.mockImplementation(
      () => new Promise<void>((_, reject) => {
        rejectDelete = reject
      }),
    )
    renderPage()

    await user.click(within(itemCard('Cordless drill')).getByRole('button', { name: 'Delete' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete item' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Cordless drill' })).not.toBeInTheDocument()
    })

    rejectDelete(new Error('Could not delete'))

    expect(await screen.findByRole('heading', { name: 'Cordless drill' })).toBeInTheDocument()
    expect(mocks.refresh).not.toHaveBeenCalled()
  })

  it('keeps the item when deletion is canceled', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(within(itemCard('Cordless drill')).getByRole('button', { name: 'Delete' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Cordless drill' })).toBeInTheDocument()
    expect(mocks.repo.deleteItem).not.toHaveBeenCalled()
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

describe('BinDetailPage add from photos', () => {
  const items = bin.items

  beforeEach(() => {
    mocks.isSignedIn = true
    mocks.refresh.mockReset()
    mocks.repo.createItem.mockReset()
    mocks.prepareItemImage.mockReset()
    mocks.extractItemFromImage.mockReset()
    document.body.innerHTML = ''
    bin.items = items
  })

  afterEach(() => {
    bin.items = items
  })

  it('opens the photo library for multiple images and not the camera', () => {
    renderPage()

    const input = screen.getByLabelText('Choose photos')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('multiple')
    expect(input).not.toHaveAttribute('capture')
    expect(screen.getByRole('button', { name: 'Add from photos' })).toBeEnabled()
  })

  it('creates an item for each selected photo from the AI details', async () => {
    const user = userEvent.setup()
    const resolvers: Array<(value: { name?: string; description?: string; tags?: string[] }) => void> = []
    mocks.prepareItemImage.mockResolvedValue('data:image/jpeg;base64,photo')
    mocks.extractItemFromImage.mockImplementation(() => new Promise((resolve) => {
      resolvers.push(resolve)
    }))
    mocks.repo.createItem.mockImplementation(async (input: { name: string }) => ({
      id: input.name,
      binId: 'bin-1',
      name: input.name,
      tags: [],
      createdAt: '2026-01-02T00:00:00.000Z',
      updatedAt: '2026-01-02T00:00:00.000Z',
    }))

    renderPage()
    const input = screen.getByLabelText('Choose photos')
    await user.upload(input, [
      new File(['coat'], 'coat.jpg', { type: 'image/jpeg' }),
      new File(['hat'], 'hat.jpg', { type: 'image/jpeg' }),
    ])

    expect(await screen.findByText('Identifying photo 1 of 2…')).toBeInTheDocument()
    expect(screen.getByText('Each photo becomes an item. Edit it afterward if a detail looks wrong.')).toBeInTheDocument()
    resolvers[0]({ name: 'Wool coat', description: 'Gray', tags: ['winter'] })

    await waitFor(() => expect(mocks.extractItemFromImage).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Identifying photo 2 of 2…')).toBeInTheDocument()
    resolvers[1]({ name: 'Knit hat', tags: ['winter'] })

    expect(await screen.findByText('Added 2 items from photos. Edit any that look wrong.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Adding from photos' })).not.toBeInTheDocument()
    expect(mocks.extractItemFromImage).toHaveBeenCalledWith('data:image/jpeg;base64,photo', {
      binName: 'Toolbox',
      category: 'Tools',
      location: 'Garage Workbench',
    })
    expect(mocks.repo.createItem).toHaveBeenNthCalledWith(1, {
      binId: 'bin-1',
      name: 'Wool coat',
      image: 'data:image/jpeg;base64,photo',
      tags: ['winter'],
    })
    expect(mocks.repo.createItem).toHaveBeenNthCalledWith(2, {
      binId: 'bin-1',
      name: 'Knit hat',
      image: 'data:image/jpeg;base64,photo',
      tags: ['winter'],
    })
    expect(mocks.refresh).toHaveBeenCalled()
  })

  it('keeps photo import in the page actions when the bin is empty', () => {
    bin.items = []
    renderPage()

    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add from photos' })).toBeInTheDocument()
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument()
  })
})
