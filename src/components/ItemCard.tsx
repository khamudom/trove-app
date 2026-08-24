import styles from './ItemCard.module.css'

interface ItemCardProps {
  name: string
  description?: string
  image?: string
  tags?: string[]
  highlighted?: boolean
  onEdit?: () => void
  onDelete?: () => void
}

export function ItemCard({ name, description, image, tags = [], highlighted = false, onEdit, onDelete }: ItemCardProps) {
  return (
    <article className={`${styles.card} ${highlighted ? styles.highlighted : ''}`}>
      <div className={styles.lead}>
        {image ? <img src={image} alt="" className={styles.image} loading="lazy" /> : <div className={styles.placeholder} aria-hidden />}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{name}</h3>
        {description && <p className={styles.description}>{description}</p>}
        {tags.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag} className={styles.tag}>{tag}</li>
            ))}
          </ul>
        )}
      </div>
      {(onEdit || onDelete) && (
        <div className={styles.actions}>
          {onEdit && <button type="button" className={styles.action} onClick={onEdit}>Edit</button>}
          {onDelete && <button type="button" className={styles.actionDanger} onClick={onDelete}>Delete</button>}
        </div>
      )}
    </article>
  )
}
