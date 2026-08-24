import { useEffect, useState } from 'react'
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

  const refresh = async () => {
    if (!binId) return
    setLoading(true)
    const data = await repo.getBinWithItems(binId)
    setBin(data)
    setLoading(false)
  }

  useEffect(() => {
    void refresh()
  }, [binId, repo])

  return { bin, loading, refresh }
}
