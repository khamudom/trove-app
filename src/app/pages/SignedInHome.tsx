import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Icons } from '@/components/Icons'
import { SearchField } from '@/components/SearchField'
import { useAuth } from '@/features/auth/AuthContext'
import {
  HOME_TIPS,
  buildSignedInHomeModel,
  type ArchiveHighlight,
} from '@/features/home/signedInHomeModel'
import { notifyInventoryChanged } from '@/lib/inventoryEvents'
import type { Bin, Item } from '@/types'
import styles from './SignedInHome.module.css'

interface SignedInHomeProps {
  bins: Bin[]
  items: Item[]
  recentBins: Bin[]
  loading: boolean
  inventoryReady: boolean
  onAddBin: () => void
}

export function SignedInHome({
  bins,
  items,
  recentBins,
  loading,
  inventoryReady,
  onAddBin,
}: SignedInHomeProps) {
  const navigate = useNavigate()
  const { repo, userEmail, displayName } = useAuth()
  const [query, setQuery] = useState('')
  const [tipOffset, setTipOffset] = useState(0)
  const [keeping, setKeeping] = useState(false)

  const model = useMemo(
    () =>
      buildSignedInHomeModel({
        bins,
        items,
        recentBins,
        displayName,
        email: userEmail,
      }),
    [bins, items, recentBins, displayName, userEmail],
  )

  const tip = HOME_TIPS[(HOME_TIPS.findIndex((entry) => entry.title === model.tip.title) + tipOffset) % HOME_TIPS.length]

  if (loading || !inventoryReady) {
    return <p className="sr-only">Loading your Trove</p>
  }

  const runSearch = (value: string) => {
    const trimmed = value.trim()
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/search')
  }

  const keepArchiveItem = async (archive: ArchiveHighlight) => {
    setKeeping(true)
    try {
      await repo.updateItem(archive.item.id, {})
      notifyInventoryChanged()
    } finally {
      setKeeping(false)
    }
  }

  const thingLabel = model.itemCount === 1 ? 'thing' : 'things'
  const binLabel = model.binCount === 1 ? 'bin' : 'bins'
  const greetingName = model.firstName ? `, ${model.firstName}` : ''

  return (
    <div className={styles.body}>
      <p className={styles.greeting}>
        Good {model.period}{greetingName}. You’re keeping track of{' '}
        <strong>{model.itemCount} {thingLabel}</strong> across{' '}
        <strong>{model.binCount} {binLabel}</strong>.
      </p>

      <SearchField
        id="home-search"
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
        placeholder={model.searchExample ? `Where is my ${model.searchExample}...` : 'Where is my…'}
        tone="accent"
      />

      {model.archive ? (
        <section className={styles.section} aria-labelledby="archive-heading">
          <h2 id="archive-heading" className={styles.sectionTitle}>From the archive</h2>
          <article className={styles.archiveCard}>
            <div className={styles.archiveImage}>
              {model.archive.item.image ? (
                <img src={model.archive.item.image} alt="" />
              ) : (
                <div className={styles.archivePlaceholder}>
                  <Icons.Camera className={styles.cameraIcon} />
                  <span>{model.archive.item.name}</span>
                </div>
              )}
            </div>
            <div className={styles.archiveBody}>
              <p className={styles.badge}>{model.archive.badge}</p>
              <h3 className={styles.archiveTitle}>{model.archive.item.name}</h3>
              <p className={styles.archiveCopy}>
                Filed in <strong>{model.archive.bin.name}</strong>
                {model.archive.bin.location ? ` · ${model.archive.bin.location}` : ''}. Still worth
                keeping, or ready to pass along?
              </p>
              <div className={styles.archiveActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={keeping}
                  onClick={() => void keepArchiveItem(model.archive!)}
                >
                  Still keeping it
                </button>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() =>
                    navigate(`/bins/${model.archive!.bin.id}?item=${model.archive!.item.id}`)
                  }
                >
                  Sell or donate
                </button>
              </div>
            </div>
          </article>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="week-heading">
        <h2 id="week-heading" className={styles.sectionTitle}>This week</h2>
        <div className={styles.weekGrid}>
          {model.insight ? (
            <Link to={model.insight.href} className={`${styles.weekCard} ${styles.weekInsight}`}>
              <p className={styles.weekTag}>{model.insight.tag}</p>
              <h3>{model.insight.title}</h3>
              <p>{model.insight.body}</p>
              <span className={styles.weekLink}>{model.insight.linkLabel}</span>
            </Link>
          ) : model.binCount === 0 ? (
            <button type="button" className={`${styles.weekCard} ${styles.weekInsight} ${styles.weekCardButton}`} onClick={onAddBin}>
              <p className={styles.weekTag}>THIS WEEK</p>
              <h3>Take a look around</h3>
              <p>Create a bin and start recording what you own, where it lives.</p>
              <span className={styles.weekLink}>Create a bin →</span>
            </button>
          ) : (
            <Link to="/bins" className={`${styles.weekCard} ${styles.weekInsight}`}>
              <p className={styles.weekTag}>THIS WEEK</p>
              <h3>Take a look around</h3>
              <p>Open a bin and add anything that’s still only in your head.</p>
              <span className={styles.weekLink}>See your bins →</span>
            </Link>
          )}
          <div className={`${styles.weekCard} ${styles.weekTip}`}>
            <p className={styles.weekTag}>{tip.tag}</p>
            <h3>{tip.title}</h3>
            <p>{tip.body}</p>
            <button
              type="button"
              className={styles.weekLinkBtn}
              onClick={() => setTipOffset((value) => value + 1)}
            >
              More tips →
            </button>
          </div>
        </div>
      </section>

      {model.looseEnds.length > 0 ? (
        <section className={styles.section} aria-labelledby="loose-heading">
          <div className={styles.sectionHeader}>
            <h2 id="loose-heading" className={styles.sectionTitle}>Loose ends</h2>
            <Link to="/bins" className={styles.textLink}>All</Link>
          </div>
          <ul className={styles.looseList}>
            {model.looseEnds.map((entry) => (
              <li key={entry.id}>
                <Link to={entry.href} className={styles.looseCard}>
                  {entry.image ? (
                    <img src={entry.image} alt="" className={styles.looseThumb} />
                  ) : (
                    <span className={styles.looseThumb} style={{ background: entry.accent }} aria-hidden>
                      {entry.kind === 'bin' ? <Icons.Bins className={styles.looseIcon} /> : null}
                    </span>
                  )}
                  <span className={styles.looseCopy}>
                    <strong>{entry.title}</strong>
                    <span>{entry.subtitle}</span>
                  </span>
                  <Icons.Chevron className={styles.chevron} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="recent-heading">
        <div className={styles.sectionHeader}>
          <h2 id="recent-heading" className={styles.sectionTitle}>Recent bins</h2>
          <button type="button" className={styles.textLink} onClick={onAddBin}>
            Add bin
          </button>
        </div>
        {model.recentBins.length > 0 ? (
          <ul className={styles.binCarousel}>
            {model.recentBins.map((bin) => (
              <li key={bin.id}>
                <Link to={`/bins/${bin.id}`} className={styles.binCard}>
                  {bin.previewImage ? (
                    <img src={bin.previewImage} alt="" className={styles.binCover} />
                  ) : (
                    <span className={styles.binCover} style={{ background: bin.accent }} aria-hidden />
                  )}
                  <span className={styles.binMeta}>
                    <strong>{bin.name}</strong>
                    <span>
                      {bin.location ? `${bin.location} · ` : ''}
                      {bin.itemCount} {bin.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyBins}>Create a bin to start keeping track of where everything lives.</p>
        )}
      </section>

      <section className={styles.stats} aria-label="This month in your Trove">
        <div>
          <p className={styles.statValue}>{model.addedThisMonth}</p>
          <p className={styles.statLabel}>Added this month</p>
        </div>
        <div>
          <p className={styles.statValue}>{model.binCount}</p>
          <p className={styles.statLabel}>Bins</p>
        </div>
        <div>
          <p className={`${styles.statValue} ${styles.statValueSerif}`}>{model.untouchedCount}</p>
          <p className={styles.statLabel}>Untouched</p>
        </div>
      </section>
    </div>
  )
}
