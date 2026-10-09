import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router';
import type { Treasure } from '../../game/treasures';
import { TreasureIcon } from './Treasure';
import styles from './TreasureDialog.module.css';
import { useModalFocus } from './useModalFocus';

interface Props {
  treasure: Treasure;
  /** 'unlock' plays the full reveal (shake, lock opens, treasure appears). 'view' plays a lighter one: the treasure turns in, then the words fade up. */
  mode: 'unlock' | 'view';
  /** A collector rank this unlock earned, announced under the story. */
  newRank?: string;
  onClose: () => void;
}

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

  useModalFocus(ref, closeRef, onClose);

  // Rendered on <body> so no card, list or transform on the page can stack above it.
  return createPortal(
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
          {golden && (
            <svg className={styles.sparkles} viewBox="0 0 100 100" focusable="false">
              {SPARKLES.map(([x, y], i) => (
                <path
                  key={i}
                  className={styles.sparkle}
                  style={{ animationDelay: `${(reveal ? 1.3 : 0.35) + i * 0.12}s` }}
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
    </div>,
    document.body,
  );
}
