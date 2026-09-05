import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertDialog, Badge, Button, Dialog, Drawer, Toast } from '@khamudom/lumen-ui-react'
import { EmptyState } from '@/components/EmptyState'
import { Icons } from '@/components/Icons'
import { ItemCard } from '@/components/ItemCard'
import { PageHeader } from '@/components/PageHeader'
import { QRLabel } from '@/components/QRLabel'
import { AuthGateSheet } from '@/features/auth/AuthGateSheet'
import { BinForm } from '@/features/bins/BinForm'
import { ItemForm } from '@/features/items/ItemForm'
import { useAuth } from '@/features/auth/AuthContext'
import { trackRecentBin } from '@/repositories/localRepository'
import { useBinDetail, useBins } from '@/hooks/useBins'
import styles from './BinDetailPage.module.css'

const UNDO_TOAST_DURATION_MS = 4000

export function BinDetailPage() {
  const { binId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const highlightItemId = searchParams.get('item')
  const navigate = useNavigate()
  const { repo, isSignedIn } = useAuth()
  const { bin, loading, refresh } = useBinDetail(binId)
  const { bins } = useBins()
  const [addItemOpen, setAddItemOpen] = useState(false)
  const [editBinOpen, setEditBinOpen] = useState(false)
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [moveMode, setMoveMode] = useState(false)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [moveTargetBinId, setMoveTargetBinId] = useState<string | null>(null)
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
  const destinationBins = useMemo(() => bins.filter((candidate) => candidate.id !== binId), [binId, bins])
  const moveTargetBin = useMemo(
    () => bins.find((candidate) => candidate.id === moveTargetBinId),
    [bins, moveTargetBinId],
  )

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

  const cancelMove = () => {
    setMoveMode(false)
    setSelectedItemIds([])
    setMoveDialogOpen(false)
    setMoveTargetBinId(null)
  }

  const toggleSelectedItem = (itemId: string, selected: boolean) => {
    setSelectedItemIds((current) => (
      selected
        ? [...current, itemId]
        : current.filter((selectedId) => selectedId !== itemId)
    ))
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title={bin.name}
        leading={(
          <button
            type="button"
            className={styles.back}
            aria-label="Back to bins"
            onClick={() => navigate('/bins')}
          >
            <Icons.Back className={styles.backIcon} />
          </button>
        )}
      />

      <div className={styles.hero}>
        {bin.previewImage && <img src={bin.previewImage} alt="" className={styles.preview} />}
        <div>
          <p className={styles.meta}>{[bin.category, bin.location].filter(Boolean).join(' · ')}</p>
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
        <Button icon={<Icons.Plus />} variant="secondary" onClick={() => setAddItemOpen(true)}>Add item</Button>
        <Button icon={<Icons.Qr />} variant="secondary" onClick={openQr}>QR label</Button>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Edit bin"
          onClick={() => setEditBinOpen(true)}
        >
          <Icons.Edit className={styles.actionIcon} />
        </button>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.deleteButton}`}
          aria-label="Delete bin"
          onClick={() => setDeleteBinOpen(true)}
        >
          <Icons.Delete className={styles.actionIcon} />
        </button>
        {bin.items.length > 0 && (
          <button
            type="button"
            className={`${styles.iconButton} ${moveMode ? styles.activeIconButton : ''}`}
            aria-label={moveMode ? 'Cancel moving items' : 'Move items'}
            aria-pressed={moveMode}
            onClick={() => {
              if (moveMode) cancelMove()
              else setMoveMode(true)
            }}
          >
            <Icons.Move className={styles.actionIcon} />
          </button>
        )}
      </div>

      <section>
        <div className={styles.itemsHeading}>
          <h2 className={styles.itemsTitle}>What's inside</h2>
          {moveMode && (
            <div className={styles.selectionActions}>
              <span aria-live="polite">
                {selectedItemIds.length} {selectedItemIds.length === 1 ? 'item' : 'items'} selected
              </span>
              <Button variant="ghost" onClick={cancelMove}>Cancel</Button>
              <Button
                disabled={selectedItemIds.length === 0}
                onClick={() => setMoveDialogOpen(true)}
              >
                Move selected
              </Button>
            </div>
          )}
        </div>
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
                selectable={moveMode}
                selected={selectedItemIds.includes(item.id)}
                onSelectedChange={(selected) => toggleSelectedItem(item.id, selected)}
                onEdit={moveMode ? undefined : () => setEditItemId(item.id)}
                onDelete={moveMode ? undefined : () => setDeleteItemId(item.id)}
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
          submitLabel="Add item"
          onSubmit={async (values) => {
            const item = await repo.createItem({ binId: bin.id, ...values })
            setAddItemOpen(false)
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

      <Dialog
        open={moveDialogOpen && !moveTargetBinId}
        heading="Move selected items"
        onOpenChange={(open) => {
          setMoveDialogOpen(open)
        }}
      >
        {destinationBins.length > 0 ? (
          <>
            <p className={styles.movePrompt}>Choose a destination bin.</p>
            <ul className={styles.binChoices}>
              {destinationBins.map((destination) => (
                <li key={destination.id}>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setMoveDialogOpen(false)
                      setMoveTargetBinId(destination.id)
                    }}
                  >
                    {destination.name}
                  </Button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className={styles.movePrompt}>Create another bin before moving selected items.</p>
        )}
      </Dialog>

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
        open={Boolean(moveTargetBinId)}
        role="alertdialog"
        title="Move selected items?"
        description={
          moveTargetBin
            ? `Move ${selectedItemIds.length} ${selectedItemIds.length === 1 ? 'item' : 'items'} to "${moveTargetBin.name}"?`
            : 'Move the selected items to this bin?'
        }
        cancelLabel="Cancel"
        actionLabel="Move"
        onOpenChange={(open) => {
          if (!open) {
            setMoveTargetBinId(null)
          }
        }}
        onAction={() => {
          if (selectedItemIds.length > 0 && moveTargetBinId) {
            void Promise.all(
              selectedItemIds.map((itemId) => repo.moveItem(itemId, moveTargetBinId)),
            ).then(() => refresh())
          }
          cancelMove()
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
