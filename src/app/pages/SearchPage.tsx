import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card, CardTitle, CardDescription, Drawer } from '@khamudom/lumen-ui-react'
import { EmptyState } from '@/components/EmptyState'
import { SearchField } from '@/components/SearchField'
import { VoiceStatus } from '@/components/VoiceStatus'
import { useAuth } from '@/features/auth/AuthContext'
import { useVoiceCommand } from '@/features/voice/useVoiceCommand'
import type { SearchResult } from '@/types'
import styles from './SearchPage.module.css'

export function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const initialQuery = params.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const { repo } = useAuth()
  const voice = useVoiceCommand(repo)

  const runSearch = async (value: string) => {
    const trimmed = value.trim()
    const current = (params.get('q') ?? '').trim()
    if (trimmed !== current) {
      setParams(trimmed ? { q: trimmed } : {}, { replace: true })
    }
    const next = trimmed ? await repo.search(trimmed) : []
    setResults(next)
    setSearched(Boolean(trimmed))
  }

  useEffect(() => {
    if (initialQuery) void runSearch(initialQuery)
  }, [])

  useEffect(() => {
    if (voice.result?.kind === 'search') {
      setResults(voice.result.results ?? [])
      setSearched(true)
      if (voice.result.results?.[0]) setQuery(voice.result.results[0].title)
    }
    if (voice.result?.kind === 'navigate' && voice.result.binId) {
      navigate(`/bins/${voice.result.binId}`)
    }
  }, [voice.result, navigate])

  return (
    <div className={styles.page}>
      <header>
        <h1>Search</h1>
        <p className={styles.subtitle}>Find anything across bins, items, tags, and locations.</p>
      </header>

      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={() => void runSearch(query)}
        onVoiceClick={() => void voice.listen()}
        autoFocus
      />

      <VoiceStatus status={voice.status} transcript={voice.transcript} message={voice.result?.message} />

      {voice.result?.kind === 'confirm_bin' && voice.result.candidates && (
        <div className={styles.choices}>
          <p>{voice.result.message}</p>
          {voice.result.candidates.map((bin) => (
            <Button
              key={bin.id}
              variant="secondary"
              onClick={() => {
                if (voice.result?.itemName) void voice.completeAddToBin(bin, voice.result.itemName)
                else navigate(`/bins/${bin.id}`)
              }}
            >
              {bin.name}
            </Button>
          ))}
        </div>
      )}

      {searched && results.length === 0 && (
        <EmptyState
          title="Couldn't find that in your Trove"
          description="Try another name, tag, category, or location."
        />
      )}

      {results.length > 0 && (
        <ul className={styles.results}>
          {results.map((result) => (
            <li key={`${result.type}-${result.itemId ?? result.binId}`}>
              <Card
                interactive
                role="link"
                tabIndex={0}
                className={styles.result}
                onClick={() => navigate(`/bins/${result.binId}${result.itemId ? `?item=${result.itemId}` : ''}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(`/bins/${result.binId}${result.itemId ? `?item=${result.itemId}` : ''}`)
                  }
                }}
              >
                <CardTitle as="h3">{result.title}</CardTitle>
                <CardDescription>{result.subtitle}</CardDescription>
                {result.location && <CardDescription>{result.location}</CardDescription>}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {voice.result?.kind === 'added_item' && voice.result.binId && (
        <Drawer
          open
          heading="Added"
          right
          onOpenChange={(open) => {
            if (!open) voice.reset()
          }}
        >
          <p>{voice.result.message}</p>
          <div className={styles.sheetActions}>
            <Button onClick={() => navigate(`/bins/${voice.result?.binId}`)}>View bin</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (voice.result?.itemId) await repo.deleteItem(voice.result.itemId)
                voice.reset()
              }}
            >
              Undo
            </Button>
          </div>
        </Drawer>
      )}
    </div>
  )
}
