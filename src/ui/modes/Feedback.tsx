import type { FeedbackMessage } from './types';
import styles from './modes.module.css';

/** Polite live region so screen readers hear the result without stealing focus. */
export function Feedback({ message }: { message: FeedbackMessage | null }) {
  const kindClass = message ? styles[message.kind] : '';
  return (
    <div className={`${styles.feedback} ${kindClass}`} role="status" aria-live="polite">
      {message?.kind === 'correct' ? <span lang="mi">{message.text}</span> : message?.text}
    </div>
  );
}
