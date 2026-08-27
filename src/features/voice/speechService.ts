export interface SpeechRecognitionResult {
  transcript: string
  isFinal: boolean
}

export interface SpeechService {
  isSupported(): boolean
  listen(onResult: (result: SpeechRecognitionResult) => void, onError: (message: string) => void): Promise<string>
  stop(): void
  cancel(): void
}

type SpeechRecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult:
    | ((event: {
        resultIndex: number
        results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean; length: number }>
      }) => void)
    | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export class BrowserSpeechService implements SpeechService {
  private recognition: InstanceType<SpeechRecognitionCtor> | null = null

  isSupported(): boolean {
    return getRecognitionCtor() !== null
  }

  listen(onResult: (result: SpeechRecognitionResult) => void, onError: (message: string) => void): Promise<string> {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      onError('Microphone unavailable')
      return Promise.reject(new Error('Speech recognition unsupported'))
    }

    this.cancel()

    return new Promise((resolve, reject) => {
      const recognition = new Ctor()
      this.recognition = recognition
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognition.continuous = false

      let latestTranscript = ''

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript.trim()
        onResult({ transcript, isFinal: result.isFinal })
        latestTranscript = transcript
      }

      recognition.onerror = (event) => {
        onError(event.error === 'not-allowed' ? 'Microphone permission denied' : 'Microphone unavailable')
        reject(new Error(event.error))
      }

      recognition.onend = () => {
        if (this.recognition === recognition) this.recognition = null
        if (latestTranscript) resolve(latestTranscript)
        else reject(new Error('No speech detected'))
      }

      recognition.start()
    })
  }

  stop(): void {
    try {
      this.recognition?.stop()
    } catch {
      // Recognition may already be stopping.
    }
  }

  cancel(): void {
    const recognition = this.recognition
    this.recognition = null
    if (recognition) {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      try {
        recognition.abort()
      } catch {
        try {
          recognition.stop()
        } catch {
          // Recognition may already be stopped.
        }
      }
    }
  }
}

export const speechService: SpeechService = new BrowserSpeechService()
