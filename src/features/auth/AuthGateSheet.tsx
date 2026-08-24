import { useState } from 'react'
import { Button } from '@/components/Button'
import { Sheet } from '@/components/Sheet'
import { useAuth } from './AuthContext'
import styles from './AuthGateSheet.module.css'

interface AuthGateSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthGateSheet({ open, onClose, onSuccess }: AuthGateSheetProps) {
  const { isConfigured, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')
    try {
      if (mode === 'sign-up') await signUp(email, password)
      else await signIn(email, password)
      onSuccess()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} title="Create an account for QR labels" onClose={onClose}>
      <div className={styles.content}>
        <p className={styles.copy}>
          Printable QR labels link to your bins across sessions and devices. Sign in to keep QR-linked bins available wherever you use Trove.
        </p>
        {!isConfigured && (
          <p className={styles.notice}>Supabase is not configured yet. Trove will keep working locally, but cloud QR labels require environment setup.</p>
        )}
        <label className={styles.field}>
          <span>Email</span>
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span>Password</span>
          <input type="password" autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <Button fullWidth disabled={loading || !isConfigured} onClick={() => void submit()}>
          {mode === 'sign-up' ? 'Create account' : 'Sign in'}
        </Button>
        <button type="button" className={styles.switch} onClick={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}>
          {mode === 'sign-up' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </Sheet>
  )
}
