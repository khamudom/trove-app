import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button, Toast } from '@khamudom/lumen-ui-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import styles from './PwaUpdateToast.module.css'

/** Check often enough that a deployed update is noticed within an active session. */
export const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000

export async function checkServiceWorkerUpdate(
  swUrl: string,
  registration: ServiceWorkerRegistration,
): Promise<void> {
  if (!navigator.onLine) return

  try {
    const response = await fetch(swUrl, {
      cache: 'no-store',
      headers: {
        cache: 'no-store',
        'cache-control': 'no-cache',
      },
    })
    if (response?.status === 200) {
      await registration.update()
    }
  } catch {
    // Ignore transient network failures; the next interval/focus check will retry.
  }
}

export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (!registration) return

      const checkForUpdate = () => {
        void checkServiceWorkerUpdate(swUrl, registration)
      }

      // Catch updates that arrived while the app was backgrounded or closed.
      checkForUpdate()

      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          checkForUpdate()
        }
      }

      document.addEventListener('visibilitychange', onVisibilityChange)
      window.addEventListener('focus', checkForUpdate)
      window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS)
    },
  })

  useEffect(() => {
    // If a waiting worker already exists (e.g. event fired before React subscribed),
    // still show the update toast.
    void navigator.serviceWorker?.getRegistration().then((registration) => {
      if (registration?.waiting) {
        setNeedRefresh(true)
      }
    })
  }, [setNeedRefresh])

  if (!needRefresh) return null

  return createPortal(
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
    </div>,
    document.body,
  )
}
