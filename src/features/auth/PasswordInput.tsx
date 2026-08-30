import { useId, useState, type InputHTMLAttributes } from 'react'
import { Icons } from '@/components/Icons'
import styles from './PasswordInput.module.css'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export function PasswordInput({
  label,
  error,
  className,
  id,
  required,
  ...inputProps
}: PasswordInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const [visible, setVisible] = useState(false)
  const describedBy = error ? `${inputId}-error` : undefined

  return (
    <div
      className={[
        'lumen-input-field',
        error ? 'lumen-input-field--error' : '',
        inputProps.disabled ? 'lumen-input-field--disabled' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      {label ? (
        <label className="lumen-input-field__label" htmlFor={inputId}>
          {label}
          {required ? (
            <span className="lumen-input-field__required" aria-hidden="true">
              {' '}
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <div className={styles.inputWrap}>
        <input
          {...inputProps}
          id={inputId}
          required={required}
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`lumen-input ${styles.input}`}
        />
        <button
          type="button"
          className={styles.toggleButton}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          disabled={inputProps.disabled}
          onPointerDown={(event) => {
            event.preventDefault()
          }}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <Icons.EyeOff className={styles.toggleIcon} /> : <Icons.Eye className={styles.toggleIcon} />}
        </button>
      </div>
      {error ? (
        <p id={describedBy} className="lumen-input-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
