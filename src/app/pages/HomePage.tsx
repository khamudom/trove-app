import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dialog } from '@khamudom/lumen-ui-react'
import { BinCard } from '@/components/BinCard'
import { Icons } from '@/components/Icons'
import { SearchField } from '@/components/SearchField'
import { BinForm } from '@/features/bins/BinForm'
import { useAuth } from '@/features/auth/AuthContext'
import { onInventoryChanged } from '@/lib/inventoryEvents'
import { getRecentBinIds } from '@/repositories/localRepository'
import { useBins } from '@/hooks/useBins'
import styles from './HomePage.module.css'

export function HomePage() {
  const navigate = useNavigate()
  const { repo } = useAuth()
  const { bins, refresh } = useBins()
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

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
        <Button icon={<Icons.Plus />} onClick={() => setCreateOpen(true)}>
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
      ) : null}

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
    </div>
  )
}
