import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '@khamudom/lumen-ui-react'
import { __resetPwaRegisterMock, __setPwaRegisterMock } from '@/test/pwaRegisterStub'
import { PwaUpdateToast } from './PwaUpdateToast'

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
})
