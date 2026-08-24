import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dialog } from '@khamudom/lumen-ui-react'
import { BinCard } from '@/components/BinCard'
import { EmptyState } from '@/components/EmptyState'
import { Icons } from '@/components/Icons'
import { BinForm } from '@/features/bins/BinForm'
import { useAuth } from '@/features/auth/AuthContext'
import { useBins } from '@/hooks/useBins'
import styles from './BinsPage.module.css'

export function BinsPage() {
  const navigate = useNavigate()
  const { repo } = useAuth()
  const { bins, loading, refresh } = useBins()
  const [createOpen, setCreateOpen] = useState(false)
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    void Promise.all(bins.map(async (bin) => [bin.id, (await repo.listItems(bin.id)).length] as const)).then((entries) => {
      setCounts(Object.fromEntries(entries))
    })
  }, [bins, repo])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1>Bins</h1>
          <p className={styles.subtitle}>Your physical storage, organized.</p>
        </div>
        <Button icon={<Icons.Plus />} onClick={() => setCreateOpen(true)}>
          Add bin
        </Button>
      </header>

      {!loading && bins.length === 0 ? (
        <EmptyState
          title="Your Trove is empty"
          description="Create your first bin to start keeping track of where everything lives."
          action={<Button onClick={() => setCreateOpen(true)}>Create bin</Button>}
        />
      ) : (
        <div className={styles.grid}>
          {bins.map((bin) => (
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
    </div>
  )
}
