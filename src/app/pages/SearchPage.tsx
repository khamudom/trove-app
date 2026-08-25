import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardTitle, CardDescription } from '@khamudom/lumen-ui-react'
import { EmptyState } from '@/components/EmptyState'
import { SearchField } from '@/components/SearchField'
import { useAuth } from '@/features/auth/AuthContext'
import type { SearchResult } from '@/types'
import styles from './SearchPage.module.css'

export function SearchPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const queryParam = params.get('q') ?? ''
  const [query, setQuery] = useState(queryParam)
  const [results, setResults] = useState<SearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const { repo } = useAuth()

  const runSearch = (value: string) => {
    const trimmed = value.trim()
    setParams(trimmed ? { q: trimmed } : {}, { replace: true })
  }

  useEffect(() => {
    setQuery(queryParam)
    const trimmed = queryParam.trim()
    if (!trimmed) {
      setResults([])
      setSearched(false)
      return
    }

    let cancelled = false
    void repo.search(trimmed).then((next) => {
      if (cancelled) return
      setResults(next)
      setSearched(true)
    })
    return () => {
      cancelled = true
    }
  }, [queryParam])

  return (
    <div className={styles.page}>
      <header>
        <h1>Search</h1>
        <p className={styles.subtitle}>Find anything across bins, items, tags, and locations.</p>
      </header>

      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={() => runSearch(query)}
        autoFocus
      />

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
    </div>
  )
}
