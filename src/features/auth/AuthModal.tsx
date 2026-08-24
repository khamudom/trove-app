import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/Button'
import { Icons } from '@/components/Icons'
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
  const titleId = useId()
  const descriptionId = useId()
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

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
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={styles.title}>{needsConfirmation ? 'Check your email' : heading}</h2>
          <button type="button" className={styles.close} aria-label="Close" onClick={onClose}>
            <Icons.Close aria-hidden />
          </button>
        </div>

        {needsConfirmation ? (
          <div className={styles.content}>
            <p id={descriptionId} className={styles.copy}>
              We sent a confirmation link to {email}. Confirm your email, then sign in.
            </p>
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
          </div>
        ) : (
          <form
            className={styles.content}
            onSubmit={(event) => {
              event.preventDefault()
              void submit()
            }}
          >
            <p id={descriptionId} className={styles.copy}>{copy}</p>
            {!isConfigured && (
              <p className={styles.notice}>
                Supabase is not configured yet. Trove will keep working locally, but accounts require environment setup.
              </p>
            )}
            <label className={styles.field}>
              <span>Email</span>
              <input
                type="email"
                autoComplete="email"
                value={email}
                required
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label className={styles.field}>
              <span>Password</span>
              <input
                type="password"
                autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
                value={password}
                required
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <Button type="submit" fullWidth disabled={loading || !isConfigured}>
              {mode === 'sign-up' ? 'Create account' : 'Sign in'}
            </Button>
            <button
              type="button"
              className={styles.switch}
              onClick={() => {
                setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')
                setError('')
              }}
            >
              {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
