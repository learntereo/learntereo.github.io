import { useCallback, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { factForUnit } from '../../content/facts';
import { TreasureIcon } from './Treasure';
import styles from './TreasureDialog.module.css';
import { useModalFocus } from './useModalFocus';

/** An original speech-bubble icon on a soft green tile. Decorative: the text beside it names it. */
export function KnowReroIcon({ size = 36, locked = false }: { size?: number; locked?: boolean }) {
  if (locked) return <TreasureIcon id="paua" size={size} locked />;
  return (
    <span style={{ display: 'inline-flex', width: size, height: size }} aria-hidden="true">
      <svg width={size} height={size} viewBox="0 0 48 48" focusable="false">
        <rect x="1" y="1" width="46" height="46" rx="12" fill="#e3f1ea" stroke="#b9d8c7" strokeWidth="1.5" />
        <path d="M10 13 H38 Q41 13 41 16 V28 Q41 31 38 31 H25 L16 38 V31 H10 Q7 31 7 28 V16 Q7 13 10 13 Z" fill="#2e6b4f" />
        <circle cx="16" cy="22" r="2.2" fill="#fff" />
        <circle cx="24" cy="22" r="2.2" fill="#fff" />
        <circle cx="32" cy="22" r="2.2" fill="#fff" />
      </svg>
    </span>
  );
}

/** The Know-rero fact for a completed unit, in the same dialog style as a kiwiana story. */
export function KnowReroDialog({ unitTitle, text, onClose }: { unitTitle: string; text: string; onClose: () => void }) {
  const titleId = useId();
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useModalFocus(ref, closeRef, onClose);

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div ref={ref} className={`${styles.dialog} ${styles.view}`} role="dialog" aria-modal="true" aria-labelledby={titleId} data-mode="view">
        <div className={styles.stage} aria-hidden="true">
          <span className={styles.treasure}>
            <KnowReroIcon size={96} />
          </span>
        </div>
        <h2 id={titleId} className={styles.title}>
          Know-rero
        </h2>
        <p className={styles.caption}>{unitTitle}</p>
        <p className={styles.story}>{text}</p>
        <div className={styles.actions}>
          <button type="button" ref={closeRef} className={styles.button} onClick={onClose}>
            Ka pai!
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** A button that opens a completed unit's Know-rero fact. */
export function KnowReroButton({ unitId, unitTitle, size, className }: { unitId: string; unitTitle: string; size: number; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const text = factForUnit(unitId);
  if (!text) return null;
  return (
    <>
      <button type="button" className={className} aria-label={`Read Know-rero for ${unitTitle}`} onClick={() => setOpen(true)}>
        <KnowReroIcon size={size} />
        <span>Know-rero</span>
      </button>
      {open && <KnowReroDialog unitTitle={unitTitle} text={text} onClose={close} />}
    </>
  );
}
