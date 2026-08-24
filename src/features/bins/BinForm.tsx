import { useState } from 'react'
import { joinTags, parseTagsInput } from '@/lib/utils'
import type { Bin } from '@/types'
import { Button } from '@/components/Button'
import { TagInput } from '@/components/TagInput'
import styles from './BinForm.module.css'

interface BinFormProps {
  initial?: Partial<Bin>
  submitLabel: string
  onSubmit: (values: {
    name: string
    description?: string
    category?: string
    tags: string[]
    location?: string
  }) => Promise<void>
}

export function BinForm({ initial, submitLabel, onSubmit }: BinFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [location, setLocation] = useState(initial?.location ?? '')
  const [tags, setTags] = useState(joinTags(initial?.tags ?? []))
  const [loading, setLoading] = useState(false)

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault()
        setLoading(true)
        void onSubmit({
          name,
          description: description || undefined,
          category: category || undefined,
          location: location || undefined,
          tags: parseTagsInput(tags),
        }).finally(() => setLoading(false))
      }}
    >
      <label className={styles.field}>
        <span>Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span>Description</span>
        <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span>Category</span>
        <input value={category} onChange={(e) => setCategory(e.target.value)} />
      </label>
      <label className={styles.field}>
        <span>Location</span>
        <input value={location} onChange={(e) => setLocation(e.target.value)} />
      </label>
      <TagInput id="bin-tags" label="Tags" value={tags} onChange={setTags} />
      <Button type="submit" fullWidth disabled={loading || !name.trim()}>{submitLabel}</Button>
    </form>
  )
}
