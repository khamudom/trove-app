import { useCallback, useState } from 'react'
import { normalizeText } from '@/lib/utils'
import type { Bin, SearchResult } from '@/types'
import type { TroveRepository } from '@/repositories/types'
import { parseVoiceCommand } from './commandParser'
import { speechService } from './speechService'

export type VoiceUiStatus = 'idle' | 'listening' | 'processing' | 'done' | 'error' | 'unsupported'

export interface VoiceActionResult {
  kind: 'message' | 'search' | 'navigate' | 'confirm_bin' | 'create_bin' | 'added_item'
  message?: string
  results?: SearchResult[]
  query?: string
  binId?: string
  itemId?: string
  itemName?: string
  binName?: string
  candidates?: Bin[]
}

export function useVoiceCommand(repo: TroveRepository) {
  const [status, setStatus] = useState<VoiceUiStatus>('idle')
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState<VoiceActionResult | null>(null)

  const resolveBinsByName = useCallback(async (binName: string) => {
    const bins = await repo.listBins()
    const target = normalizeText(binName)
    return bins.filter((bin) => normalizeText(bin.name).includes(target))
  }, [repo])

  const executeParsed = useCallback(async (text: string): Promise<VoiceActionResult> => {
    const parsed = parseVoiceCommand(text)
    const command = parsed.command

    if (command.intent === 'find_item' || command.intent === 'search') {
      const results = await repo.search(command.query)
      return {
        kind: 'search',
        results,
        query: command.query,
        message: results.length ? undefined : "Couldn't find that in your Trove",
      }
    }

    if (command.intent === 'show_bin' || command.intent === 'list_bin_contents') {
      const matches = await resolveBinsByName(command.binName)
      if (matches.length === 1) return { kind: 'navigate', binId: matches[0].id }
      if (matches.length > 1) return { kind: 'confirm_bin', candidates: matches, message: `Which ${command.binName}?` }
      return { kind: 'create_bin', binName: command.binName, message: `I couldn't find a bin named ${command.binName}.` }
    }

    if (command.intent === 'add_item') {
      const matches = await resolveBinsByName(command.binName)
      if (matches.length === 1) {
        const item = await repo.createItem({ binId: matches[0].id, name: command.itemName })
        return {
          kind: 'added_item',
          binId: matches[0].id,
          itemId: item.id,
          itemName: item.name,
          binName: matches[0].name,
          message: `Added ${item.name} to ${matches[0].name}`,
        }
      }
      if (matches.length > 1) return { kind: 'confirm_bin', candidates: matches, message: `Which ${command.binName}?`, itemName: command.itemName }
      return { kind: 'create_bin', binName: command.binName, itemName: command.itemName, message: `I couldn't find a bin named ${command.binName}.` }
    }

    return { kind: 'message', message: "Couldn't understand that" }
  }, [repo, resolveBinsByName])

  const reset = useCallback(() => {
    setTranscript('')
    setResult(null)
    setStatus('idle')
    speechService.cancel()
  }, [])

  const listen = useCallback(async () => {
    if (!speechService.isSupported()) {
      setStatus('unsupported')
      return
    }

    setStatus('listening')
    setTranscript('')
    setResult(null)

    try {
      const finalText = await speechService.listen(
        (partial) => setTranscript(partial.transcript),
        () => setStatus('error'),
      )
      setTranscript(finalText)
      setStatus('processing')
      const action = await executeParsed(finalText)
      setResult(action)
      setStatus('done')
    } catch {
      setStatus((current) => (current === 'listening' ? 'error' : current))
    }
  }, [executeParsed])

  const completeAddToBin = useCallback(async (bin: Bin, itemName?: string) => {
    if (!itemName) return
    const item = await repo.createItem({ binId: bin.id, name: itemName })
    setResult({
      kind: 'added_item',
      binId: bin.id,
      itemId: item.id,
      itemName: item.name,
      binName: bin.name,
      message: `Added ${item.name} to ${bin.name}`,
    })
    setStatus('done')
  }, [repo])

  const stop = useCallback(() => {
    speechService.stop()
  }, [])

  return {
    status,
    transcript,
    result,
    listening: status === 'listening',
    listen,
    reset,
    executeParsed,
    completeAddToBin,
    stop,
  }
}
