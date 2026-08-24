import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

const mocks = vi.hoisted(() => ({
  isConfigured: true,
  isLoading: false,
  isSignedIn: false,
  userEmail: undefined as string | undefined,
  signOut: vi.fn(),
}))

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: () => ({
    isConfigured: mocks.isConfigured,
    isLoading: mocks.isLoading,
    isSignedIn: mocks.isSignedIn,
    userEmail: mocks.userEmail,
    signOut: mocks.signOut,
    signIn: vi.fn(),
    signUp: vi.fn(),
  }),
}))

describe('ProfilePage', () => {
  beforeEach(() => {
    mocks.isConfigured = true
    mocks.isLoading = false
    mocks.isSignedIn = false
    mocks.userEmail = undefined
    mocks.signOut.mockReset()
  })

  it('opens the sign-in modal when signed out', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('opens the sign-up modal when signed out', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(screen.getByRole('heading', { name: 'Create an account' })).toBeInTheDocument()
  })

  it('shows the signed-in account and confirms sign out', async () => {
    const user = userEvent.setup()
    mocks.isSignedIn = true
    mocks.userEmail = 'you@example.com'
    mocks.signOut.mockResolvedValue(undefined)

    render(<ProfilePage />)

    expect(screen.getByText('you@example.com')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Sign out' }))

    expect(mocks.signOut).toHaveBeenCalled()
  })
})
