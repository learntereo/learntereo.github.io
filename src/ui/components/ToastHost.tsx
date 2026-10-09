import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastMessage } from '../../lib/toastBus';
import styles from './ToastHost.module.css';

const VISIBLE_MS = 6000;

/** Renders toasts raised through `showToast`. Mount once near the app root. */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(
    () =>
      subscribeToasts((toast) => {
        setToasts((current) => [...current.slice(-2), toast]);
        window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== toast.id)), VISIBLE_MS);
      }),
    [],
  );

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.kind]}`}>
          <span>{toast.text}</span>
          <button
            type="button"
            className={styles.close}
            aria-label="Dismiss"
            onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
