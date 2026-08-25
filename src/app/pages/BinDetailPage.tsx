import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertDialog, Badge, Button, Dialog, Drawer, Toast } from '@khamudom/lumen-ui-react'
import { EmptyState } from '@/components/EmptyState'
import { Icons } from '@/components/Icons'
import { ItemCard } from '@/components/ItemCard'
import { QRLabel } from '@/components/QRLabel'
import { AuthGateSheet } from '@/features/auth/AuthGateSheet'
import { BinForm } from '@/features/bins/BinForm'
import { ItemForm } from '@/features/items/ItemForm'
import { useAuth } from '@/features/auth/AuthContext'
import { trackRecentBin } from '@/repositories/localRepository'
import { useBinDetail } from '@/hooks/useBins'
import styles from './BinDetailPage.module.css'

const UNDO_TOAST_DURATION_MS = 4000

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

  useEffect(() => {
    if (!undoItemId) return
    const timer = window.setTimeout(() => setUndoItemId(null), UNDO_TOAST_DURATION_MS)
    return () => window.clearTimeout(timer)
  }, [undoItemId])

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
      <button
        type="button"
        className={styles.back}
        aria-label="Back to bins"
        onClick={() => navigate('/bins')}
      >
        <Icons.Back className={styles.backIcon} />
      </button>

      <div className={styles.hero}>
        {bin.previewImage && <img src={bin.previewImage} alt="" className={styles.preview} />}
        <div>
          <p className={styles.meta}>{[bin.category, bin.location].filter(Boolean).join(' · ')}</p>
          <h1>{bin.name}</h1>
          {bin.description && <p className={styles.description}>{bin.description}</p>}
          {bin.tags.length > 0 && (
            <ul className={styles.tags}>
              {bin.tags.map((tag) => (
                <li key={tag}>
                  <Badge appearance="tint">{tag}</Badge>
                </li>
              ))}
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
        <div className={styles.undoBar}>
          <Toast
            title="Item added."
            action={(
              <Button
                variant="ghost"
                onClick={async () => {
                  await repo.deleteItem(undoItemId)
                  setUndoItemId(null)
                  await refresh()
                }}
              >
                Undo
              </Button>
            )}
            onClose={() => setUndoItemId(null)}
          />
        </div>
      )}

      <Dialog open={addItemOpen} heading="Add item" onOpenChange={setAddItemOpen}>
        <ItemForm
          keepOpen
          submitLabel="Add item"
          onSubmit={async (values) => {
            const item = await repo.createItem({ binId: bin.id, ...values })
            setUndoItemId(item.id)
            await refresh()
          }}
        />
      </Dialog>

      <Drawer
        open={Boolean(editingItem)}
        heading="Edit item"
        right
        onOpenChange={(open) => {
          if (!open) setEditItemId(null)
        }}
      >
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
      </Drawer>

      <Dialog open={editBinOpen} heading="Edit bin" onOpenChange={setEditBinOpen}>
        <BinForm
          initial={bin}
          submitLabel="Save bin"
          onSubmit={async (values) => {
            await repo.updateBin(bin.id, values)
            setEditBinOpen(false)
            await refresh()
          }}
        />
      </Dialog>

      <Dialog open={qrOpen} heading="Print QR label" onOpenChange={setQrOpen}>
        {bin.qrToken && <QRLabel binName={bin.name} qrToken={bin.qrToken} onClose={() => setQrOpen(false)} />}
      </Dialog>

      <AuthGateSheet
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        onSuccess={async () => {
          await refresh()
          const updated = await repo.getBin(bin.id)
          if (updated?.qrToken) setQrOpen(true)
        }}
      />

      <AlertDialog
        open={deleteBinOpen}
        role="alertdialog"
        title="Delete bin?"
        description="This removes the bin and everything inside it."
        actionLabel="Delete bin"
        destructive
        onOpenChange={setDeleteBinOpen}
        onAction={() => {
          void repo.deleteBin(bin.id).then(() => navigate('/bins'))
        }}
      />

      <AlertDialog
        open={Boolean(deleteItemId)}
        role="alertdialog"
        title="Delete item?"
        description="This item will be removed from the bin."
        actionLabel="Delete item"
        destructive
        onOpenChange={(open) => {
          if (!open) setDeleteItemId(null)
        }}
        onAction={() => {
          if (deleteItemId) void repo.deleteItem(deleteItemId).then(() => refresh())
          setDeleteItemId(null)
        }}
      />
    </div>
  )
}
