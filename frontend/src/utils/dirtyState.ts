let unsavedChanges = false;
const listeners = new Set<(dirty: boolean) => void>();

export function setUnsavedChanges(dirty: boolean) {
  unsavedChanges = dirty;
  listeners.forEach((listener) => listener(dirty));
}

export function hasUnsavedChanges() {
  return unsavedChanges;
}

export function subscribeUnsavedChanges(listener: (dirty: boolean) => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
