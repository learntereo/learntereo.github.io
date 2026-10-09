import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router';
import type { Treasure } from '../../game/treasures';
import { TreasureIcon } from './Treasure';
import styles from './TreasureDialog.module.css';

interface Props {
  treasure: Treasure;
  /** 'unlock' plays the reveal (shake, lock opens, treasure appears). 'view' shows the finished state at once. */
  mode: 'unlock' | 'view';
  /** A collector rank this unlock earned, announced under the story. */
  newRank?: string;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled])';
const SPARKLES = [
  [8, 14],
  [88, 10],
  [14, 62],
  [92, 58],
  [30, 4],
  [70, 86],
  [50, 92],
  [4, 38],
  [96, 34],
];

/**
 * A modal dialog for a collected treasure. Focus stays inside, Escape or the
 * button closes it, and it is labelled by its heading. Only an unlocked
 * treasure can be shown here, so the story never appears for a locked one.
 */
export function TreasureDialog({ treasure, mode, newRank, onClose }: Props) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const golden = treasure.id === 'golden-kiwi';
  const reveal = mode === 'unlock';

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !ref.current) return;
      const nodes = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!ref.current.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      before?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className={`${styles.dialog} ${golden ? styles.golden : ''} ${reveal ? styles.reveal : styles.view}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-mode={mode}
      >
        <div className={styles.stage} aria-hidden="true">
          {golden && reveal && (
            <svg className={styles.sparkles} viewBox="0 0 100 100" focusable="false">
              {SPARKLES.map(([x, y], i) => (
                <path
                  key={i}
                  className={styles.sparkle}
                  style={{ animationDelay: `${1.3 + i * 0.12}s` }}
                  d={`M${x} ${y - 4} L${x + 1.2} ${y - 1.2} L${x + 4} ${y} L${x + 1.2} ${y + 1.2} L${x} ${y + 4} L${x - 1.2} ${y + 1.2} L${x - 4} ${y} L${x - 1.2} ${y - 1.2} Z`}
                  fill="#f2c14e"
                />
              ))}
            </svg>
          )}
          {reveal && (
            <span className={styles.lock}>
              <TreasureIcon id={treasure.id} size={golden ? 140 : 110} locked />
            </span>
          )}
          <span className={styles.treasure}>
            <TreasureIcon id={treasure.id} size={golden ? 140 : 110} />
          </span>
        </div>

        <h2 id={titleId} className={styles.title}>
          {reveal ? 'You unlocked: ' : ''}
          {treasure.name}
          {reveal ? '!' : ''}
        </h2>
        <p className={styles.caption}>{treasure.caption}</p>
        <p className={styles.story}>{treasure.story}</p>
        {reveal && newRank && <p className={styles.rank}>New rank: {newRank}!</p>}

        <div className={styles.actions}>
          <button type="button" ref={closeRef} className={styles.button} onClick={onClose}>
            Ka pai!
          </button>
          {reveal && (
            <Link className={styles.link} to="/kiwiana">
              See your Kiwiana
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
