import { useState } from 'react'
import { joinTags, parseTagsInput } from '@/lib/utils'
import type { Item } from '@/types'
import { Button } from '@/components/Button'
import { TagInput } from '@/components/TagInput'
import styles from './ItemForm.module.css'

interface ItemFormProps {
  initial?: Partial<Item>
  submitLabel: string
  keepOpen?: boolean
  onSubmit: (values: {
    name: string
    description?: string
    tags: string[]
  }) => Promise<void>
}

export function ItemForm({ initial, submitLabel, keepOpen = false, onSubmit }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState(joinTags(initial?.tags ?? []))
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    await onSubmit({
      name,
      description: description || undefined,
      tags: parseTagsInput(tags),
    })
    setLoading(false)
    if (keepOpen) {
      setName('')
      setDescription('')
      setTags('')
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        void handleSubmit()
      }}
    >
      <label className={styles.field}>
        <span>Name</span>
        <input required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span>Description</span>
        <textarea value={description} rows={2} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <TagInput id="item-tags" label="Tags" value={tags} onChange={setTags} />
      <Button type="submit" fullWidth disabled={loading || !name.trim()}>{submitLabel}</Button>
    </form>
  )
}
