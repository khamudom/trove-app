import { Badge, Button, Card, CardDescription, CardTitle } from '@khamudom/lumen-ui-react'
import styles from './ItemCard.module.css'

interface ItemCardProps {
  name: string
  description?: string
  image?: string
  tags?: string[]
  highlighted?: boolean
  selectable?: boolean
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
  onMove?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export function ItemCard({
  name,
  description,
  image,
  tags = [],
  highlighted = false,
  selectable = false,
  selected = false,
  onSelectedChange,
  onMove,
  onEdit,
  onDelete,
}: ItemCardProps) {
  return (
    <Card
      interactive={selectable}
      className={[
        styles.card,
        highlighted ? styles.highlighted : '',
        selected ? styles.selected : '',
        selectable ? styles.selectable : '',
      ].filter(Boolean).join(' ')}
      onClick={(event) => {
        if (!selectable || !onSelectedChange || (event.target as HTMLElement).closest('input, button')) return
        onSelectedChange(!selected)
      }}
    >
      {selectable && (
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={selected}
          aria-label={`Select ${name}`}
          onChange={(event) => onSelectedChange?.(event.target.checked)}
        />
      )}
      <div className={styles.lead}>
        {image ? <img src={image} alt="" className={styles.image} loading="lazy" /> : <div className={styles.placeholder} aria-hidden />}
      </div>
      <div className={styles.body}>
        <CardTitle as="h3">{name}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        {tags.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {tags.map((tag) => (
              <li key={tag}>
                <Badge appearance="tint">{tag}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(onMove || onEdit || onDelete) && (
        <div className={styles.actions}>
          {onMove && <Button variant="ghost" onClick={onMove}>Move</Button>}
          {onEdit && <Button variant="ghost" onClick={onEdit}>Edit</Button>}
          {onDelete && <Button variant="ghost" onClick={onDelete}>Delete</Button>}
        </div>
      )}
    </Card>
  )
}
