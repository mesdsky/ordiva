let hasUnsavedChanges = false;

type UnsavedChangesListener = (value: boolean) => void;

const listeners = new Set<UnsavedChangesListener>();

export function setUnsavedChanges(value: boolean) {
  hasUnsavedChanges = value;

  listeners.forEach((listener) => listener(value));
}

export function getUnsavedChanges() {
  return hasUnsavedChanges;
}

export function subscribeUnsavedChanges(
  listener: UnsavedChangesListener
) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}