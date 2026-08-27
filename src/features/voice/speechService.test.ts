import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BrowserSpeechService } from '@/features/voice/speechService'

type RecognitionHandlers = {
  onresult: ((event: {
    resultIndex: number
    results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }>
  }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

function installMockRecognition() {
  const instances: Array<
    RecognitionHandlers & {
      start: ReturnType<typeof vi.fn>
      abort: ReturnType<typeof vi.fn>
      stop: ReturnType<typeof vi.fn>
      continuous: boolean
    }
  > = []

  class MockSpeechRecognition {
    lang = ''
    interimResults = false
    maxAlternatives = 1
    continuous = false
    onresult: RecognitionHandlers['onresult'] = null
    onerror: RecognitionHandlers['onerror'] = null
    onend: RecognitionHandlers['onend'] = null
    start = vi.fn()
    abort = vi.fn()
    stop = vi.fn()

    constructor() {
      instances.push(this)
    }
  }

  Object.defineProperty(window, 'SpeechRecognition', {
    configurable: true,
    writable: true,
    value: MockSpeechRecognition,
  })
  Object.defineProperty(window, 'webkitSpeechRecognition', {
    configurable: true,
    writable: true,
    value: MockSpeechRecognition,
  })

  return instances
}

describe('BrowserSpeechService listen', () => {
  let instances: ReturnType<typeof installMockRecognition>

  beforeEach(() => {
    instances = installMockRecognition()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('resolves with the final transcript from a single listen session', async () => {
    const service = new BrowserSpeechService()
    const onResult = vi.fn()
    const onError = vi.fn()

    const promise = service.listen(onResult, onError)
    expect(instances).toHaveLength(1)
    expect(instances[0].start).toHaveBeenCalledOnce()
    expect(instances[0].continuous).toBe(false)

    instances[0].onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'add hammer to the toolbox' }, isFinal: true, length: 1 }],
    })
    instances[0].onend?.()

    await expect(promise).resolves.toBe('add hammer to the toolbox')
    expect(onResult).toHaveBeenCalledWith({
      transcript: 'add hammer to the toolbox',
      isFinal: true,
    })
    expect(onError).not.toHaveBeenCalled()
  })

  it('stops listening and resolves with the latest transcript', async () => {
    const service = new BrowserSpeechService()
    const promise = service.listen(vi.fn(), vi.fn())

    instances[0].onresult?.({
      resultIndex: 0,
      results: [{ 0: { transcript: 'find my tent' }, isFinal: false, length: 1 }],
    })

    service.stop()

    expect(instances[0].stop).toHaveBeenCalledOnce()
    expect(instances[0].abort).not.toHaveBeenCalled()

    instances[0].onend?.()

    await expect(promise).resolves.toBe('find my tent')
  })
})
