import { useState } from 'react'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
} from '@khamudom/lumen-ui-react'
import { AuthModal, type AuthMode } from '@/features/auth/AuthModal'
import { useAuth } from '@/features/auth/AuthContext'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { isConfigured, isLoading, isSignedIn, userEmail, signOut } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [signOutOpen, setSignOutOpen] = useState(false)

  if (isLoading) return <p className={styles.loading}>Loading…</p>

  const initial = userEmail?.trim().charAt(0).toUpperCase() ?? '?'

  return (
    <div className={styles.page}>
      <header>
        <h1>Profile</h1>
        <p className={styles.subtitle}>
          {isSignedIn ? 'Your Trove account' : 'Trying Trove as a guest'}
        </p>
      </header>

      <Card className={styles.card}>
        <CardContent className={styles.cardContent}>
          {isSignedIn ? (
            <>
              <div className={styles.identity}>
                <Avatar size="lg" aria-hidden>
                  <AvatarFallback>{initial}</AvatarFallback>
                </Avatar>
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
                Build one bin as a guest. Create a free account to add more bins and keep everything available across your devices.
              </p>
              {!isConfigured && (
                <Alert>
                  <AlertDescription>
                    Supabase is not configured yet. Guest bins stay in this session only and are not saved.
                  </AlertDescription>
                </Alert>
              )}
              <div className={styles.actions}>
                <Button disabled={!isConfigured} onClick={() => setAuthMode('sign-in')}>Sign in</Button>
                <Button variant="secondary" disabled={!isConfigured} onClick={() => setAuthMode('sign-up')}>
                  Sign up
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {authMode !== null && (
        <AuthModal
          open
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
        />
      )}

      <AlertDialog
        open={signOutOpen}
        role="alertdialog"
        title="Sign out?"
        description="You'll return to a guest session. Account bins stay in the cloud until you sign back in."
        actionLabel="Sign out"
        onOpenChange={setSignOutOpen}
        onAction={() => {
          void signOut()
        }}
      />
    </div>
  )
}
