import { AuthModal } from './AuthModal'

interface AuthGateSheetProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AuthGateSheet({ open, onClose, onSuccess }: AuthGateSheetProps) {
  if (!open) return null

  return (
    <AuthModal
      open
      initialMode="sign-up"
      title="Create an account for QR labels"
      description="Printable QR labels link to your bins across sessions and devices. Sign in to keep QR-linked bins available wherever you use Trove."
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
