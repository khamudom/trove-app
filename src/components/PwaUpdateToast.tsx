import { Button, Toast } from '@khamudom/lumen-ui-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './PwaUpdateToast.module.css'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return

      const checkForUpdate = () => {
        void registration.update()
      }

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkForUpdate()
        }
      }

      document.addEventListener('visibilitychange', onVisibilityChange)
      window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  return (
    <div className={styles.bar} role="status" aria-live="polite">
      <Toast
        title="Update available"
        description="A new version of Trove is ready."
        action={(
          <Button variant="ghost" onClick={() => void updateServiceWorker(true)}>
            Update
          </Button>
        )}
        onClose={() => setNeedRefresh(false)}
      />
    </div>
  )
}
