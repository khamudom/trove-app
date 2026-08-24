import styles from './IconButton.module.css'

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
}

export function IconButton({ label, active = false, className = '', children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      className={`${styles.button} ${active ? styles.active : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
