import { units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { TREASURE_COUNT, nextTreasure, treasureSlots, unlockedTreasureIds } from '../../game/treasures';
import { TreasureIcon } from '../components/Treasure';
import ui from '../components/ui.module.css';
import styles from './Kiwiana.module.css';

const SLOTS = treasureSlots(units);

/** The Kiwiana page: all 20 treasures, in colour once collected and as silhouettes until then. */
export function Kiwiana() {
  const { statuses } = useAppData();
  const unlocked = unlockedTreasureIds(SLOTS, statuses);
  const next = nextTreasure(SLOTS, statuses);
  const count = unlocked.size;

  return (
    <main className={ui.page}>
      <div>
        <h1>Kiwiana</h1>
        <p className={ui.muted}>Finish units to collect treasures from Aotearoa New Zealand.</p>
      </div>

      <section className={`${ui.card} ${styles.summary}`} aria-label="Collection progress">
        <p className={styles.big}>
          {count} / {TREASURE_COUNT} collected
        </p>
        <div
          className={ui.bar}
          role="progressbar"
          aria-label="Kiwiana collected"
          aria-valuemin={0}
          aria-valuemax={TREASURE_COUNT}
          aria-valuenow={count}
        >
          <div className={ui.barFill} style={{ width: `${(count / TREASURE_COUNT) * 100}%` }} />
        </div>
        {count === TREASURE_COUNT && (
          <p>
            <span lang="mi">Ka rawe!</span> You have collected them all.
          </p>
        )}
      </section>

      <ul className={styles.grid}>
        {SLOTS.map(({ treasure, unit }) => {
          const got = unlocked.has(treasure.id);
          const isNext = next?.treasure.id === treasure.id;
          return (
            <li
              key={treasure.id}
              className={`${ui.card} ${styles.item} ${isNext ? styles.next : ''}`}
              aria-current={isNext ? 'step' : undefined}
            >
              <TreasureIcon id={treasure.id} size={64} locked={!got} />
              <div className={styles.text}>
                {got ? (
                  <>
                    <h2 className={styles.name}>{treasure.name}</h2>
                    <p className={ui.muted}>{treasure.caption}</p>
                  </>
                ) : (
                  <>
                    <h2 className={styles.name}>{isNext ? 'Next up' : 'Locked'}</h2>
                    <p className={ui.muted}>Finish {unit.title} to unlock</p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
