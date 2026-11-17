import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBinDetail } from './useBins'

const bin = {
  id: 'bin-1',
  name: 'Toolbox',
  tags: [],
  items: [
    {
      id: 'item-1',
      binId: 'bin-1',
      name: 'Cordless drill',
      tags: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const mocks = vi.hoisted(() => ({
  repo: {
    getBinWithItems: vi.fn(),
  },
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({ repo: mocks.repo }),
}))

describe('useBinDetail', () => {
  beforeEach(() => {
    mocks.repo.getBinWithItems.mockReset()
    mocks.repo.getBinWithItems.mockResolvedValue(bin)
  })

  it('reloads bin details in the background without returning to the loading state', async () => {
    const { result } = renderHook(() => useBinDetail('bin-1'))

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.bin?.items).toHaveLength(1)

    let resolveRefresh: (value: typeof bin) => void = () => {}
    mocks.repo.getBinWithItems.mockImplementation(
      () => new Promise((resolve) => {
        resolveRefresh = resolve
      }),
    )

    const pending = result.current.refresh({ background: true })
    expect(result.current.loading).toBe(false)
    expect(result.current.bin?.name).toBe('Toolbox')

    resolveRefresh({ ...bin, items: [] })
    await pending

    await waitFor(() => expect(result.current.bin?.items).toHaveLength(0))
    expect(result.current.loading).toBe(false)
  })
})
