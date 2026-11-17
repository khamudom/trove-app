import { useEffect, useRef, useState } from 'react'
import type { Bin, Item } from '@/types'
import { useAuth } from '@/features/auth/AuthContext'

export function useBins() {
  const { repo } = useAuth()
  const [bins, setBins] = useState<Bin[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    setLoading(true)
    const data = await repo.listBins()
    setBins(data)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [repo])

  return { bins, loading, refresh }
}

export function useBinDetail(binId?: string) {
  const { repo } = useAuth()
  const [bin, setBin] = useState<(Bin & { items: Item[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const refresh = async (options?: { background?: boolean }) => {
    const requestedId = binId
    if (!requestedId) return
    const id = ++requestId.current
    if (!options?.background) setLoading(true)
    const data = await repo.getBinWithItems(requestedId)
    if (requestId.current !== id) return
    setBin(data)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [binId, repo])

  return { bin, loading, refresh }
}
