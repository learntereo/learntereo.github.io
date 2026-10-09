import { LETTER_KEYS, MACRON_KEYS } from './keyboardChoice';
import styles from './modes.module.css';

interface Props {
  onInsert: (text: string) => void;
  onBackspace: () => void;
  /** Show the "Use phone keyboard" switch (touch devices only). */
  touch: boolean;
  usePhoneKeyboard: boolean;
  onTogglePhoneKeyboard: (value: boolean) => void;
}

/** Tap-to-spell keys for Write mode. Keys never take focus, so the caret stays in the answer box. */
export function MaoriKeyboard({ onInsert, onBackspace, touch, usePhoneKeyboard, onTogglePhoneKeyboard }: Props) {
  // Keep focus (and the cursor) in the text box when a key is pressed.
  const keep = (e: { preventDefault: () => void }) => e.preventDefault();
  return (
    <div className={styles.keyboard}>
      <div className={styles.keys} role="group" aria-label="Māori letters">
        {[...LETTER_KEYS, ...MACRON_KEYS].map((letter) => (
          <button
            key={letter}
            type="button"
            className={styles.macronKey}
            lang="mi"
            onMouseDown={keep}
            onClick={() => onInsert(letter)}
            aria-label={`letter ${letter}`}
          >
            {letter}
          </button>
        ))}
        <button
          type="button"
          className={`${styles.macronKey} ${styles.keyWide}`}
          onMouseDown={keep}
          onClick={() => onInsert(' ')}
          aria-label="space"
        >
          space
        </button>
        <button
          type="button"
          className={`${styles.macronKey} ${styles.keyWide}`}
          onMouseDown={keep}
          onClick={onBackspace}
          aria-label="backspace"
        >
          {'⌫'}
        </button>
      </div>
      {touch && (
        <label className={styles.phoneToggle}>
          <input type="checkbox" checked={usePhoneKeyboard} onChange={(e) => onTogglePhoneKeyboard(e.target.checked)} />
          Use phone keyboard
        </label>
      )}
    </div>
  );
}
