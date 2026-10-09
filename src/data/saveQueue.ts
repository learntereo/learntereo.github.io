import { showToast } from '../lib/toastBus';
import { createWriteQueue } from './retry';

let toastShown = false;

/**
 * The app-wide queue for progress writes. Failures show one non-blocking toast
 * (not one per question) and the writes stay queued for the next attempt.
 */
export const saveQueue = createWriteQueue({
  onFailure: () => {
    if (toastShown) return;
    toastShown = true;
    const offline = typeof navigator !== 'undefined' && navigator.onLine === false;
    showToast(
      offline ? "You're offline. Progress will save when you reconnect." : "Couldn't save progress, we'll keep trying.",
      'error',
    );
  },
  onRecovered: () => {
    toastShown = false;
  },
});

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void saveQueue.flush());
}
