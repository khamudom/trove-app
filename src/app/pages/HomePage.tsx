import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dialog } from '@khamudom/lumen-ui-react'
import { BinCard } from '@/components/BinCard'
import { Icons } from '@/components/Icons'
import { SearchField } from '@/components/SearchField'
import { AuthGateSheet } from '@/features/auth/AuthGateSheet'
import { GUEST_SECOND_BIN_DESCRIPTION, GUEST_SECOND_BIN_TITLE } from '@/features/auth/guestBinLimit'
import { BinForm } from '@/features/bins/BinForm'
import { useAuth } from '@/features/auth/AuthContext'
import { onInventoryChanged } from '@/lib/inventoryEvents'
import { getRecentBinIds } from '@/repositories/localRepository'
import { useBins } from '@/hooks/useBins'
import styles from './HomePage.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const { repo, isSignedIn } = useAuth()
  const { bins, refresh } = useBins()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [authGateOpen, setAuthGateOpen] = useState(false)

  const recentBins = useMemo(() => {
    const recentIds = getRecentBinIds()
    const ordered = recentIds.map((id) => bins.find((bin) => bin.id === id)).filter(Boolean)
    const remainder = bins.filter((bin) => !recentIds.includes(bin.id))
    return [...ordered, ...remainder].slice(0, 4) as typeof bins
  }, [bins])

  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    let cancelled = false
    const loadCounts = () => {
      void Promise.all(bins.map(async (bin) => [bin.id, (await repo.listItems(bin.id)).length] as const)).then((entries) => {
        if (!cancelled) setCounts(Object.fromEntries(entries))
      })
    }
    loadCounts()
    const unsubscribe = onInventoryChanged(() => {
      if (!cancelled) loadCounts()
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [bins, repo])

  const requestCreateBin = () => {
    if (!isSignedIn && bins.length >= 1) {
      setAuthGateOpen(true)
      return
    }
    setCreateOpen(true)
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.title}>Trove</h1>
        <p className={styles.subtitle}>Know what you own. Know where it lives.</p>
      </header>

      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
      />

      <div className={styles.actions}>
        <Button icon={<Icons.Plus />} onClick={requestCreateBin}>
          Add bin
        </Button>
        <Button variant="secondary" onClick={() => navigate('/bins')}>All bins</Button>
      </div>

      {recentBins.length > 0 ? (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Recent bins</h2>
          </div>
          <div className={styles.grid}>
            {recentBins.map((bin) => (
              <BinCard
                key={bin.id}
                id={bin.id}
                name={bin.name}
                location={bin.location}
                category={bin.category}
                itemCount={counts[bin.id] ?? 0}
                previewImage={bin.previewImage}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className={styles.welcome} aria-labelledby="welcome-title">
          <div className={styles.welcomeIllustration} aria-hidden="true">
            <span className={`${styles.sparkle} ${styles.sparkleOne}`}>✦</span>
            <span className={`${styles.sparkle} ${styles.sparkleTwo}`}>✧</span>
            <span className={`${styles.sparkle} ${styles.sparkleThree}`}>✦</span>
            <div className={styles.memoryCard}>
              <svg viewBox="0 0 150 112" role="presentation">
                <path className={styles.boxBack} d="M27 38 75 17l48 21-48 23Z" />
                <path className={styles.boxLeft} d="m27 38 48 23v42L27 79Z" />
                <path className={styles.boxRight} d="m123 38-48 23v42l48-24Z" />
                <path className={styles.boxTape} d="m61 23 48 22-15 8-48-23Z" />
                <path className={styles.boxLabel} d="m85 68 25-12v17L85 85Z" />
                <path className={styles.boxHeart} d="M92 70c1.5-4 7-3 7.2.4.2-3.5 5.8-5.2 7.3-1.1 1.4 3.7-6.6 9.7-6.6 9.7s-9.3-3.8-7.9-9Z" />
              </svg>
            </div>
            <div className={styles.storyThread} />
          </div>

          <div className={styles.welcomeCopy}>
            <p className={styles.eyebrow}>Less searching. More living.</p>
            <h2 id="welcome-title" className={styles.welcomeTitle}>
              Everything you own. Right where you left it.
            </h2>
            <p className={styles.welcomeText}>
              Trove turns closets, garages, and storage bins into one searchable home. Add what
              matters, label the box, and find anything in seconds.
            </p>
            <Button icon={<Icons.Plus />} onClick={requestCreateBin}>
              Create your first bin
            </Button>
          </div>

          <ol className={styles.storySteps} aria-label="How Trove works">
            <li>
              <span className={styles.stepNumber}>1</span>
              <div>
                <h3>Pack it.</h3>
                <p>Build a visual record as you put things away.</p>
              </div>
            </li>
            <li>
              <span className={styles.stepNumber}>2</span>
              <div>
                <h3>Label it.</h3>
                <p>Give every bin a scannable shortcut.</p>
              </div>
            </li>
            <li>
              <span className={styles.stepNumber}>3</span>
              <div>
                <h3>Find it.</h3>
                <p>Search, ask, or scan. There it is.</p>
              </div>
            </li>
          </ol>
        </section>
      )}

      <Dialog open={createOpen} heading="Create bin" onOpenChange={setCreateOpen}>
        <BinForm
          submitLabel="Create bin"
          onSubmit={async (values) => {
            const bin = await repo.createBin(values)
            await refresh()
            setCreateOpen(false)
            navigate(`/bins/${bin.id}`)
          }}
        />
      </Dialog>

      <AuthGateSheet
        open={authGateOpen}
        title={GUEST_SECOND_BIN_TITLE}
        description={GUEST_SECOND_BIN_DESCRIPTION}
        onClose={() => setAuthGateOpen(false)}
        onSuccess={() => {
          setAuthGateOpen(false)
          setCreateOpen(true)
        }}
      />
    </div>
  )
}
