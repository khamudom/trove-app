import { useEffect, useRef, useState } from 'react'
import { Icons } from './Icons'
import styles from './SearchField.module.css'

/** Keep in sync with AppShell mobile page transition duration. */
const MOBILE_PAGE_TRANSITION_MS = 260
const MOBILE_MEDIA_QUERY = '(max-width: 959px)'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}

function getIsMobile() {
  return typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search anything…',
  autoFocus = false,
  id = 'global-search',
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)
  const hasValue = value.length > 0
  const canSubmit = value.trim().length > 0
  const showClearButton = hasFocusWithin && hasValue
  const clearSearch = () => {
    onChange('')
    inputRef.current?.focus()
  }

  useEffect(() => {
    if (!autoFocus) {
      return
    }

    // Delay focus on mobile until the tab slide finishes. Focusing mid-transition
    // pans the visual viewport toward the translated input and looks like overshoot.
    const delay = getIsMobile() ? MOBILE_PAGE_TRANSITION_MS + 20 : 0
    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, delay)

    return () => window.clearTimeout(timeoutId)
  }, [autoFocus])

  return (
    <div className={styles.wrap}>
      <form
        className={styles.field}
        role="search"
        onFocusCapture={() => setHasFocusWithin(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setHasFocusWithin(false)
          }
        }}
        onSubmit={(event) => {
          event.preventDefault()
          if (canSubmit) {
            onSubmit?.()
          }
        }}
      >
        <Icons.Search className={styles.searchIcon} />
        <input
          ref={inputRef}
          id={id}
          className={styles.input}
          type="search"
          value={value}
          placeholder={placeholder}
          aria-label="Search Trove"
          onChange={(event) => onChange(event.target.value)}
        />
        {showClearButton ? (
          <button
            className={styles.actionButton}
            type="button"
            aria-label="Clear search"
            onPointerDown={(event) => {
              event.preventDefault()
              clearSearch()
            }}
            onClick={clearSearch}
          >
            <Icons.Close className={styles.actionIcon} />
          </button>
        ) : (
          <button
            className={styles.actionButton}
            type="submit"
            aria-label="Submit search"
            disabled={!canSubmit}
          >
            <Icons.Enter className={styles.actionIcon} />
          </button>
        )}
      </form>
    </div>
  )
}
