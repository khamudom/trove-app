import { useEffect, useState, type ReactNode } from 'react'
import styles from './PageHeader.module.css'

const COMPACT_SCROLL_OFFSET = 24

type PageHeaderProps = {
  title: string
  subtitle?: ReactNode
  leading?: ReactNode
  action?: ReactNode
  large?: boolean
  standalone?: boolean
}

export function PageHeader({
  title,
  subtitle,
  leading,
  action,
  large = false,
  standalone = false,
}: PageHeaderProps) {
  const [compact, setCompact] = useState(false)
  const sizeClass = large ? styles.large : ''
  const subtitleClass = subtitle ? styles.withSubtitle : ''
  const standaloneClass = standalone ? styles.standalone : ''

  useEffect(() => {
    const updateCompactState = () => setCompact(window.scrollY > COMPACT_SCROLL_OFFSET)

    updateCompactState()
    window.addEventListener('scroll', updateCompactState, { passive: true })

    return () => window.removeEventListener('scroll', updateCompactState)
  }, [])

  return (
    <>
      <header
        className={`${styles.header} ${sizeClass} ${standaloneClass} ${compact ? styles.compact : ''}`}
      >
        {leading ? <div className={styles.leading}>{leading}</div> : null}
        <div className={styles.copy}>
          <h1>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {action ? <div className={styles.action}>{action}</div> : null}
      </header>
      <div
        className={`${styles.spacer} ${sizeClass} ${subtitleClass} ${standaloneClass}`}
        aria-hidden
      />
    </>
  )
}
