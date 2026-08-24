import { CardDescription, CardTitle } from '@khamudom/lumen-ui-react'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <CardTitle as="h2">{title}</CardTitle>
      <CardDescription className={styles.description}>{description}</CardDescription>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  )
}
