import { Button } from '@khamudom/lumen-ui-react'
import { Icons } from './Icons'
import styles from './SearchField.module.css'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  onSubmit?: () => void
  onVoiceClick?: () => void
  placeholder?: string
  autoFocus?: boolean
  id?: string
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  onVoiceClick,
  placeholder = 'Search anything…',
  autoFocus = false,
  id = 'global-search',
}: SearchFieldProps) {
  return (
    <form
      className={styles.field}
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.()
      }}
    >
      <Icons.Search className={styles.searchIcon} />
      <input
        id={id}
        className={styles.input}
        type="search"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label="Search Trove"
        onChange={(event) => onChange(event.target.value)}
      />
      {onVoiceClick && (
        <Button
          variant="ghost"
          className={styles.voiceButton}
          aria-label="Search with voice"
          onClick={onVoiceClick}
          icon={<Icons.Mic />}
        />
      )}
    </form>
  )
}
