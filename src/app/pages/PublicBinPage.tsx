import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@khamudom/lumen-ui-react'
import { EmptyState } from '@/components/EmptyState'
import { ItemCard } from '@/components/ItemCard'
import { createPublicBinReader } from '@/repositories'
import { useAuth } from '@/features/auth/AuthContext'
import type { PublicBin } from '@/types'
import styles from './PublicBinPage.module.css'

export function PublicBinPage() {
  const { qrToken = '' } = useParams()
  const navigate = useNavigate()
  const { isSignedIn, repo } = useAuth()
  const [bin, setBin] = useState<PublicBin | null>(null)
  const [ownerBinId, setOwnerBinId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const reader = createPublicBinReader()
      const data = await reader.getByQrToken(qrToken)
      if (!data) {
        setMissing(true)
        setBin(null)
      } else {
        setBin(data)
        setMissing(false)
      }

      if (isSignedIn) {
        const bins = await repo.listBins()
        const owned = bins.find((entry) => entry.qrToken === qrToken)
        setOwnerBinId(owned?.id ?? null)
      }

      setLoading(false)
    }
    void load()
  }, [qrToken, isSignedIn, repo])

  if (loading) return <p className={styles.loading}>Loading…</p>

  if (missing || !bin) {
    return (
      <EmptyState
        title="This label isn't available"
        description="The QR code may be invalid or the bin may have been removed."
        action={<Button onClick={() => navigate('/')}>Browse Trove</Button>}
      />
    )
  }

  return (
    <div className={styles.page}>
      <p className={styles.kicker}>Scanned bin</p>
      <header className={styles.header}>
        {bin.previewImage && <img src={bin.previewImage} alt="" className={styles.preview} />}
        <div>
          <h1>{bin.name}</h1>
          <p className={styles.meta}>{[bin.category, bin.location].filter(Boolean).join(' · ')}</p>
          {bin.description && <p className={styles.description}>{bin.description}</p>}
        </div>
      </header>

      <section>
        <h2>Contents</h2>
        <div className={styles.items}>
          {bin.items.length === 0 ? (
            <p className={styles.empty}>Nothing recorded yet.</p>
          ) : (
            bin.items.map((item) => (
              <ItemCard key={item.name} name={item.name} description={item.description} image={item.image} tags={item.tags} />
            ))
          )}
        </div>
      </section>

      {ownerBinId && (
        <Link to={`/bins/${ownerBinId}`} className={styles.manageLink}>
          Manage this bin
        </Link>
      )}
    </div>
  )
}
