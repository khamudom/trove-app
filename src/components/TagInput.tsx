import styles from './TagInput.module.css'

interface TagInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}

export function TagInput({ id, label, value, onChange }: TagInputProps) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.label}>{label}</span>
      <input
        id={id}
        className={styles.input}
        value={value}
        placeholder="tool, seasonal"
        onChange={(event) => onChange(event.target.value)}
      />
      <span className={styles.hint}>Separate tags with commas</span>
    </label>
  )
}
