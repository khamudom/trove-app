import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthModal } from './AuthModal'

const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  isConfigured: true,
}))

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    isConfigured: mocks.isConfigured,
    signIn: mocks.signIn,
    signUp: mocks.signUp,
  }),
}))

describe('AuthModal', () => {
  beforeEach(() => {
    mocks.signIn.mockReset()
    mocks.signUp.mockReset()
    mocks.isConfigured = true
  })

  it('submits sign-in credentials', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    const onClose = vi.fn()
    mocks.signIn.mockResolvedValue(undefined)

    render(<AuthModal open initialMode="sign-in" onClose={onClose} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/email/i), 'you@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(mocks.signIn).toHaveBeenCalledWith('you@example.com', 'secret1')
    expect(onSuccess).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('shows a confirmation message when sign-up needs email verification', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    mocks.signUp.mockResolvedValue({ needsConfirmation: true })

    render(<AuthModal open initialMode="sign-up" onClose={() => {}} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/email/i), 'you@example.com')
    await user.type(screen.getByLabelText(/password/i), 'secret1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText(/We sent a confirmation link/)).toBeInTheDocument()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('switches between sign-in and sign-up', async () => {
    const user = userEvent.setup()
    render(<AuthModal open initialMode="sign-in" onClose={() => {}} />)

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Need an account? Sign up' }))
    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument()
  })

  it('explains unavailable accounts without naming infrastructure', () => {
    mocks.isConfigured = false
    render(<AuthModal open initialMode="sign-up" onClose={() => {}} />)

    expect(
      screen.getByText(/Accounts aren't available right now/),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Supabase/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
  })
})
