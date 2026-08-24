import { Link } from 'react-router-dom'
import styles from './BinCard.module.css'

interface BinCardProps {
  id: string
  name: string
  location?: string
  category?: string
  itemCount: number
  previewImage?: string
}

export function BinCard({ id, name, location, category, itemCount, previewImage }: BinCardProps) {
  return (
    <Link to={`/bins/${id}`} className={styles.card}>
      <div className={styles.imageWrap}>
        {previewImage ? (
          <img src={previewImage} alt="" className={styles.image} loading="lazy" />
        ) : (
          <div className={styles.placeholder} aria-hidden />
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.meta}>
          {[category, location].filter(Boolean).join(' · ') || 'No location yet'}
        </p>
        <p className={styles.count}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
      </div>
    </Link>
  )
}
