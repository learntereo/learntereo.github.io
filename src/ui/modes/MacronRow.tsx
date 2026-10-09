import { MACRON_VOWELS_LOWER, MACRON_VOWELS_UPPER } from '../../game/macronMarking';
import styles from './modes.module.css';

/** A row of macron buttons for keyboards that make them hard to type. */
export function MacronRow({ onInsert }: { onInsert: (letter: string) => void }) {
  return (
    <div className={styles.macronRows} role="group" aria-label="Macron letters">
      {[MACRON_VOWELS_LOWER, MACRON_VOWELS_UPPER].map((row) => (
        <div key={row[0]} className={styles.macronRow}>
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              className={styles.macronKey}
              lang="mi"
              // Keep focus (and the cursor) in the text box when a key is pressed.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onInsert(letter)}
              aria-label={`Insert ${letter}`}
            >
              {letter}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
