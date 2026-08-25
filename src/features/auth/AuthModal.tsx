import { useState } from 'react'
import { Alert, AlertDescription, Button, Dialog, Input } from '@khamudom/lumen-ui-react'
import { useAuth } from './AuthContext'
import styles from './AuthModal.module.css'

export type AuthMode = 'sign-in' | 'sign-up'

interface AuthModalProps {
  open: boolean
  initialMode?: AuthMode
  title?: string
  description?: string
  onClose: () => void
  onSuccess?: () => void
}

export function AuthModal({
  open,
  initialMode = 'sign-in',
  title,
  description,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const { isConfigured, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const heading = title ?? (mode === 'sign-up' ? 'Create an account' : 'Sign in')
  const copy = description ?? (mode === 'sign-up'
    ? 'Create an account to keep your bins and QR labels available across devices.'
    : 'Sign in to sync your bins and print QR labels.')

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      if (mode === 'sign-up') {
        const result = await signUp(email, password)
        if (result.needsConfirmation) {
          setNeedsConfirmation(true)
          return
        }
      } else {
        await signIn(email, password)
      }
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
      heading={needsConfirmation ? 'Check your email' : heading}
      description={needsConfirmation
        ? `We sent a confirmation link to ${email}. Confirm your email, then sign in.`
        : copy}
    >
      {needsConfirmation ? (
        <Button
          fullWidth
          onClick={() => {
            setNeedsConfirmation(false)
            setMode('sign-in')
            setPassword('')
          }}
        >
          Sign in
        </Button>
      ) : (
        <form
          className={styles.form}
          onSubmit={(event) => {
            event.preventDefault()
            void submit()
          }}
        >
          {!isConfigured && (
            <Alert>
              <AlertDescription>
                Accounts aren't available right now. You can keep using your guest bin for this visit.
              </AlertDescription>
            </Alert>
          )}
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            required
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            label="Password"
            type="password"
            autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
            value={password}
            required
            minLength={6}
            error={error || undefined}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button type="submit" fullWidth loading={loading} disabled={!isConfigured}>
            {mode === 'sign-up' ? 'Create account' : 'Sign in'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            fullWidth
            onClick={() => {
              setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')
              setError('')
            }}
          >
            {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
          </Button>
        </form>
      )}
    </Dialog>
  )
}
