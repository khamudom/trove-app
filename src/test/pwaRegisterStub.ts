type RegisterSWOptions = {
  onRegisteredSW?: (swScriptUrl: string, registration?: ServiceWorkerRegistration) => void
  onRegisterError?: (error: unknown) => void
}

type PwaRegisterMock = {
  needRefresh: boolean
  setNeedRefresh: (value: boolean) => void
  updateServiceWorker: (reloadPage?: boolean) => Promise<void>
}

const mock: PwaRegisterMock = {
  needRefresh: false,
  setNeedRefresh: () => {},
  updateServiceWorker: async () => {},
}

let lastOptions: RegisterSWOptions | undefined

export function __setPwaRegisterMock(partial: Partial<PwaRegisterMock>) {
  Object.assign(mock, partial)
}

export function __resetPwaRegisterMock() {
  mock.needRefresh = false
  mock.setNeedRefresh = () => {}
  mock.updateServiceWorker = async () => {}
  lastOptions = undefined
}

export function __getLastRegisterOptions() {
  return lastOptions
}

export function useRegisterSW(options?: RegisterSWOptions) {
  lastOptions = options
  return {
    needRefresh: [mock.needRefresh, mock.setNeedRefresh] as [
      boolean,
      (value: boolean) => void,
    ],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: mock.updateServiceWorker,
  }
}
