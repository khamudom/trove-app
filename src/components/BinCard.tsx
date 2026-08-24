import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardTitle } from '@khamudom/lumen-ui-react'
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
    <Link to={`/bins/${id}`} className={styles.link}>
      <Card interactive className={styles.card}>
        <div className={styles.imageWrap}>
          {previewImage ? (
            <img src={previewImage} alt="" className={styles.image} loading="lazy" />
          ) : (
            <div className={styles.placeholder} aria-hidden />
          )}
        </div>
        <CardContent className={styles.content}>
          <CardTitle as="h3">{name}</CardTitle>
          <CardDescription>
            {[category, location].filter(Boolean).join(' · ') || 'No location yet'}
          </CardDescription>
          <p className={styles.count}>{itemCount} {itemCount === 1 ? 'item' : 'items'}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
