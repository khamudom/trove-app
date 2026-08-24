import { useState } from 'react'
import { Button, Input, Textarea } from '@khamudom/lumen-ui-react'
import { joinTags, parseTagsInput } from '@/lib/utils'
import type { Item } from '@/types'
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
      <Input
        label="Name"
        required
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <Textarea
        label="Description"
        value={description}
        rows={2}
        onChange={(event) => setDescription(event.target.value)}
      />
      <Input
        id="item-tags"
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
