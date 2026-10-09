export type ToastKind = 'info' | 'error' | 'success';

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  text: string;
}

type Listener = (toast: ToastMessage) => void;

const listeners = new Set<Listener>();
let nextId = 1;

/** Show a non-blocking toast from anywhere (including the data layer). */
export function showToast(text: string, kind: ToastKind = 'info'): void {
  const toast: ToastMessage = { id: nextId++, kind, text };
  listeners.forEach((listener) => listener(toast));
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
