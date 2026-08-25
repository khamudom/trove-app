const INVENTORY_CHANGED = 'trove:inventory-changed'

export function notifyInventoryChanged() {
  window.dispatchEvent(new Event(INVENTORY_CHANGED))
}

export function onInventoryChanged(listener: () => void) {
  window.addEventListener(INVENTORY_CHANGED, listener)
  return () => window.removeEventListener(INVENTORY_CHANGED, listener)
}
