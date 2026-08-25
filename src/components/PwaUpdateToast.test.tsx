import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@khamudom/lumen-ui-react'
import {
  __getLastRegisterOptions,
  __resetPwaRegisterMock,
  __setPwaRegisterMock,
} from '@/test/pwaRegisterStub'
import { checkServiceWorkerUpdate, PwaUpdateToast } from './PwaUpdateToast'

describe('PwaUpdateToast', () => {
  const updateServiceWorker = vi.fn(async () => {})
  const setNeedRefresh = vi.fn()

  beforeEach(() => {
    __resetPwaRegisterMock()
    updateServiceWorker.mockReset()
    setNeedRefresh.mockReset()
    __setPwaRegisterMock({
      needRefresh: false,
      updateServiceWorker,
      setNeedRefresh,
    })
  })

  it('renders nothing when no update is waiting', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <PwaUpdateToast />
      </ThemeProvider>,
    )

    expect(screen.queryByText('Update available')).not.toBeInTheDocument()
  })

  it('shows an update toast and reloads when Update is pressed', async () => {
    __setPwaRegisterMock({ needRefresh: true, updateServiceWorker, setNeedRefresh })
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="light">
        <PwaUpdateToast />
      </ThemeProvider>,
    )

    expect(screen.getByText('Update available')).toBeInTheDocument()
    expect(document.body.querySelector('[aria-live="polite"]')).not.toBeNull()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('dismisses the toast when closed', async () => {
    __setPwaRegisterMock({ needRefresh: true, updateServiceWorker, setNeedRefresh })
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="light">
        <PwaUpdateToast />
      </ThemeProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(setNeedRefresh).toHaveBeenCalledWith(false)
  })

  it('prompts when a waiting service worker already exists on mount', async () => {
    const waiting = {} as ServiceWorker
    const registration = {
      waiting,
      update: vi.fn(),
    } as unknown as ServiceWorkerRegistration

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistration: vi.fn(async () => registration),
      },
    })

    render(
      <ThemeProvider defaultTheme="light">
        <PwaUpdateToast />
      </ThemeProvider>,
    )

    await waitFor(() => {
      expect(setNeedRefresh).toHaveBeenCalledWith(true)
    })
  })

  it('registers visibility and focus update checks after SW registration', async () => {
    const update = vi.fn(async () => {})
    const registration = { update, waiting: null } as unknown as ServiceWorkerRegistration
    const fetchMock = vi.fn(async () => ({ status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ThemeProvider defaultTheme="light">
        <PwaUpdateToast />
      </ThemeProvider>,
    )

    const options = __getLastRegisterOptions()
    expect(options?.onRegisteredSW).toBeTypeOf('function')
    options?.onRegisteredSW?.('/sw.js', registration)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
      expect(update).toHaveBeenCalled()
    })

    fetchMock.mockClear()
    update.mockClear()

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))

    await waitFor(() => {
      expect(update).toHaveBeenCalled()
    })

    fetchMock.mockClear()
    update.mockClear()
    window.dispatchEvent(new Event('focus'))

    await waitFor(() => {
      expect(update).toHaveBeenCalled()
    })

    vi.unstubAllGlobals()
  })
})

describe('checkServiceWorkerUpdate', () => {
  it('skips the update check while offline', async () => {
    const update = vi.fn(async () => {})
    const registration = { update } as unknown as ServiceWorkerRegistration
    const fetchMock = vi.fn(async () => ({ status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: false })

    await checkServiceWorkerUpdate('/sw.js', registration)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(update).not.toHaveBeenCalled()

    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true })
    vi.unstubAllGlobals()
  })
})
