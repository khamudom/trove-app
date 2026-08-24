import { useState } from 'react'
import { Button, Input, Textarea } from '@khamudom/lumen-ui-react'
import { joinTags, parseTagsInput } from '@/lib/utils'
import type { Bin } from '@/types'
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
      <Input
        label="Name"
        required
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Textarea
        label="Description"
        value={description}
        rows={3}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Input
        label="Category"
        value={category}
        onChange={(event) => setCategory(event.target.value)}
      />
      <Input
        label="Location"
        value={location}
        onChange={(event) => setLocation(event.target.value)}
      />
      <Input
        id="bin-tags"
        label="Tags"
        value={tags}
        placeholder="tool, seasonal"
        helperText="Separate tags with commas"
        onChange={(event) => setTags(event.target.value)}
      />
      <Button type="submit" fullWidth loading={loading} disabled={!name.trim()}>{submitLabel}</Button>
    </form>
  )
}
