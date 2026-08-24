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

export function __setPwaRegisterMock(partial: Partial<PwaRegisterMock>) {
  Object.assign(mock, partial)
}

export function __resetPwaRegisterMock() {
  mock.needRefresh = false
  mock.setNeedRefresh = () => {}
  mock.updateServiceWorker = async () => {}
}

export function useRegisterSW(_options?: RegisterSWOptions) {
  return {
    needRefresh: [mock.needRefresh, mock.setNeedRefresh] as [
      boolean,
      (value: boolean) => void,
    ],
    offlineReady: [false, () => {}] as [boolean, (value: boolean) => void],
    updateServiceWorker: mock.updateServiceWorker,
  }
}
