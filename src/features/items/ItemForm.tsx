import { useEffect, useRef, useState } from 'react'
import { Button, Input, Textarea } from '@khamudom/lumen-ui-react'
import { Icons } from '@/components/Icons'
import { BrowserSpeechService, type SpeechService } from '@/features/voice/speechService'
import { joinTags, parseTagsInput } from '@/lib/utils'
import type { Item } from '@/types'
import { parseItemVoiceInput } from './parseItemVoiceInput'
import { prepareItemImage } from './prepareItemImage'
import styles from './ItemForm.module.css'

interface ItemFormProps {
  initial?: Partial<Item>
  submitLabel: string
  onSubmit: (values: {
    name: string
    description?: string
    image?: string
    tags: string[]
  }) => Promise<void>
  speechService?: SpeechService
}

export function ItemForm({ initial, submitLabel, onSubmit, speechService }: ItemFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState(joinTags(initial?.tags ?? []))
  const [image, setImage] = useState(initial?.image)
  const [loading, setLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [message, setMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [browserSpeechService] = useState(() => new BrowserSpeechService())
  const speech = speechService ?? browserSpeechService

  useEffect(() => () => speech.cancel(), [speech])

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await onSubmit({
        name,
        description: description || undefined,
        image,
        tags: parseTagsInput(tags),
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePhoto = async (file?: File) => {
    if (!file) return
    setMessage('')
    setPhotoLoading(true)
    try {
      setImage(await prepareItemImage(file))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not add this photo')
    } finally {
      setPhotoLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleVoice = async () => {
    if (listening) {
      speech.stop()
      return
    }

    setMessage('')
    setVoiceTranscript('')
    setListening(true)
    try {
      const transcript = await speech.listen(
        (result) => setVoiceTranscript(result.transcript),
        (error) => setMessage(error),
      )
      const parsed = parseItemVoiceInput(transcript)
      if (parsed.name) setName(parsed.name)
      if (parsed.description) setDescription(parsed.description)
      if (parsed.tags) setTags(joinTags(parsed.tags))

      if (!parsed.name && !parsed.description && !parsed.tags) {
        setMessage('Start with “add”, “description is”, or “tag it”.')
      } else {
        setMessage('Item details added from voice.')
      }
    } catch {
      // The speech service reports a user-facing error.
    } finally {
      setListening(false)
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
      <div className={styles.addOptions} aria-label="Add item options">
        <button
          type="button"
          className={styles.option}
          disabled={photoLoading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Icons.Camera className={styles.optionIcon} />
          <span>{photoLoading ? 'Preparing…' : image ? 'Change photo' : 'Take photo'}</span>
        </button>
        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Take or choose item photo"
          onChange={(event) => void handlePhoto(event.target.files?.[0])}
        />
        <button
          type="button"
          className={`${styles.option} ${listening ? styles.optionActive : ''}`}
          disabled={!speech.isSupported()}
          aria-pressed={listening}
          onClick={() => void handleVoice()}
        >
          {listening
            ? <Icons.Stop className={styles.optionIcon} />
            : <Icons.Mic className={styles.optionIcon} />}
          <span>{listening ? 'Stop listening' : 'Add with voice'}</span>
        </button>
      </div>

      {image && (
        <div className={styles.photoPreview}>
          <img src={image} alt="Item preview" />
          <button type="button" className={styles.removePhoto} onClick={() => setImage(undefined)}>
            Remove photo
          </button>
        </div>
      )}

      <p className={styles.voiceHint}>
        Say “Add Superman comic book. Description is first edition. Tag it comic, collectible.”
      </p>
      {(voiceTranscript || message) && (
        <div className={styles.feedback} aria-live="polite">
          {voiceTranscript && <span>“{voiceTranscript}”</span>}
          {message && <span>{message}</span>}
        </div>
      )}

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
