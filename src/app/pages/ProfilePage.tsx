import { useState } from 'react'
import { Button } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { AuthModal, type AuthMode } from '@/features/auth/AuthModal'
import { useAuth } from '@/features/auth/AuthContext'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { isConfigured, isLoading, isSignedIn, userEmail, signOut } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [signOutOpen, setSignOutOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (isLoading) return <p className={styles.loading}>Loading…</p>

  const initial = userEmail?.trim().charAt(0).toUpperCase() ?? '?'

  return (
    <div className={styles.page}>
      <header>
        <h1>Profile</h1>
        <p className={styles.subtitle}>
          {isSignedIn ? 'Your Trove account' : 'You are using Trove on this device'}
        </p>
      </header>

      <section className={styles.card}>
        {isSignedIn ? (
          <>
            <div className={styles.identity}>
              <span className={styles.avatar} aria-hidden>{initial}</span>
              <div>
                <p className={styles.email}>{userEmail}</p>
                <p className={styles.meta}>Signed in · bins save to your account</p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setSignOutOpen(true)}>Sign out</Button>
          </>
        ) : (
          <>
            <p className={styles.copy}>
              Sign in or create an account to sync bins across devices and print QR labels.
            </p>
            {!isConfigured && (
              <p className={styles.notice}>
                Supabase is not configured yet. Local bins still work on this device.
              </p>
            )}
            <div className={styles.actions}>
              <Button disabled={!isConfigured} onClick={() => setAuthMode('sign-in')}>Sign in</Button>
              <Button variant="secondary" disabled={!isConfigured} onClick={() => setAuthMode('sign-up')}>
                Sign up
              </Button>
            </div>
          </>
        )}
      </section>

      {authMode !== null && (
        <AuthModal
          open
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
        />
      )}

      <Dialog
        open={signOutOpen}
        title="Sign out?"
        description="You'll keep using Trove on this device with local bins. Account bins stay in the cloud until you sign back in."
        confirmLabel={signingOut ? 'Signing out…' : 'Sign out'}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => {
          if (signingOut) return
          setSigningOut(true)
          void signOut().finally(() => {
            setSigningOut(false)
            setSignOutOpen(false)
          })
        }}
      />
    </div>
  )
}
