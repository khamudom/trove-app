import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/Button'
import { Dialog } from '@/components/Dialog'
import { EmptyState } from '@/components/EmptyState'
import { ItemCard } from '@/components/ItemCard'
import { QRLabel } from '@/components/QRLabel'
import { Sheet } from '@/components/Sheet'
import { AuthGateSheet } from '@/features/auth/AuthGateSheet'
import { BinForm } from '@/features/bins/BinForm'
import { ItemForm } from '@/features/items/ItemForm'
import { useAuth } from '@/features/auth/AuthContext'
import { trackRecentBin } from '@/repositories/localRepository'
import { useBinDetail } from '@/hooks/useBins'
import styles from './BinDetailPage.module.css'

export function BinDetailPage() {
  const { binId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const highlightItemId = searchParams.get('item')
  const navigate = useNavigate()
  const { repo, isSignedIn } = useAuth()
  const { bin, loading, refresh } = useBinDetail(binId)
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [editBinOpen, setEditBinOpen] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [deleteBinOpen, setDeleteBinOpen] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [qrOpen, setQrOpen] = useState(false)
  const [authGateOpen, setAuthGateOpen] = useState(false)
  const [undoItemId, setUndoItemId] = useState<string | null>(null)

  useEffect(() => {
    if (binId) trackRecentBin(binId)
  }, [binId])

  const editingItem = useMemo(() => bin?.items.find((item) => item.id === editItemId), [bin, editItemId])

  if (loading) return <p className={styles.loading}>Loading…</p>
  if (!bin) {
    return (
      <EmptyState
        title="Bin not found"
        description="This bin may have been deleted or the link is no longer valid."
        action={<Button onClick={() => navigate('/bins')}>Back to bins</Button>}
      />
    )
  }

  const openQr = () => {
    if (!isSignedIn || !bin.qrToken) {
      setAuthGateOpen(true)
      return
    }
    setQrOpen(true)
  }

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        {bin.previewImage && <img src={bin.previewImage} alt="" className={styles.preview} />}
        <div>
          <p className={styles.meta}>{[bin.category, bin.location].filter(Boolean).join(' · ')}</p>
          <h1>{bin.name}</h1>
          {bin.description && <p className={styles.description}>{bin.description}</p>}
          {bin.tags.length > 0 && (
            <ul className={styles.tags}>
              {bin.tags.map((tag) => <li key={tag}>{tag}</li>)}
            </ul>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={() => setAddItemOpen(true)}>Add item</Button>
        <Button variant="secondary" onClick={openQr}>QR label</Button>
        <Button variant="ghost" onClick={() => setEditBinOpen(true)}>Edit bin</Button>
        <Button variant="ghost" onClick={() => setDeleteBinOpen(true)}>Delete bin</Button>
      </div>

      <section>
        <h2 className={styles.itemsTitle}>What's inside</h2>
        {bin.items.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="Add what's inside this bin so you won't have to open it next time."
            action={<Button onClick={() => setAddItemOpen(true)}>Add item</Button>}
          />
        ) : (
          <div className={styles.items}>
            {bin.items.map((item) => (
              <ItemCard
                key={item.id}
                name={item.name}
                description={item.description}
                image={item.image}
                tags={item.tags}
                highlighted={item.id === highlightItemId}
                onEdit={() => setEditItemId(item.id)}
                onDelete={() => setDeleteItemId(item.id)}
              />
            ))}
          </div>
        )}
      </section>

      {undoItemId && (
        <div className={styles.undoBar} role="status">
          Item added.
          <button type="button" onClick={async () => {
            await repo.deleteItem(undoItemId)
            setUndoItemId(null)
            await refresh()
          }}>Undo</button>
        </div>
      )}

      <Sheet open={addItemOpen} title="Add item" onClose={() => setAddItemOpen(false)}>
        <ItemForm
          keepOpen
          submitLabel="Add item"
          onSubmit={async (values) => {
            const item = await repo.createItem({ binId: bin.id, ...values })
            setUndoItemId(item.id)
            await refresh()
          }}
        />
      </Sheet>

      <Sheet open={Boolean(editingItem)} title="Edit item" onClose={() => setEditItemId(null)}>
        {editingItem && (
          <ItemForm
            initial={editingItem}
            submitLabel="Save item"
            onSubmit={async (values) => {
              await repo.updateItem(editingItem.id, values)
              setEditItemId(null)
              await refresh()
            }}
          />
        )}
      </Sheet>

      <Sheet open={editBinOpen} title="Edit bin" onClose={() => setEditBinOpen(false)}>
        <BinForm
          initial={bin}
          submitLabel="Save bin"
          onSubmit={async (values) => {
            await repo.updateBin(bin.id, values)
            setEditBinOpen(false)
            await refresh()
          }}
        />
      </Sheet>

      <Sheet open={qrOpen} title="Print QR label" onClose={() => setQrOpen(false)}>
        {bin.qrToken && <QRLabel binName={bin.name} qrToken={bin.qrToken} onClose={() => setQrOpen(false)} />}
      </Sheet>

      <AuthGateSheet
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        onSuccess={async () => {
          await refresh()
          const updated = await repo.getBin(bin.id)
          if (updated?.qrToken) setQrOpen(true)
        }}
      />

      <Dialog
        open={deleteBinOpen}
        title="Delete bin?"
        description="This removes the bin and everything inside it."
        confirmLabel="Delete bin"
        destructive
        onCancel={() => setDeleteBinOpen(false)}
        onConfirm={async () => {
          await repo.deleteBin(bin.id)
          navigate('/bins')
        }}
      />

      <Dialog
        open={Boolean(deleteItemId)}
        title="Delete item?"
        description="This item will be removed from the bin."
        confirmLabel="Delete item"
        destructive
        onCancel={() => setDeleteItemId(null)}
        onConfirm={async () => {
          if (deleteItemId) await repo.deleteItem(deleteItemId)
          setDeleteItemId(null)
          await refresh()
        }}
      />
    </div>
  )
}
