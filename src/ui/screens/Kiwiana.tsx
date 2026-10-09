import { useCallback, useState } from 'react';
import { units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { TREASURE_COUNT, nextTreasure, rankFor, treasureSlots, unlockedTreasureIds } from '../../game/treasures';
import { TreasureIcon } from '../components/Treasure';
import { TreasureDialog } from '../components/TreasureDialog';
import ui from '../components/ui.module.css';
import styles from './Kiwiana.module.css';

const SLOTS = treasureSlots(units);

/** The Kiwiana page: all 20 treasures, in colour once collected and as silhouettes until then. */
export function Kiwiana() {
  const { statuses } = useAppData();
  const unlocked = unlockedTreasureIds(SLOTS, statuses);
  const next = nextTreasure(SLOTS, statuses);
  const count = unlocked.size;
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const opened = SLOTS.find((s) => s.treasure.id === openId && unlocked.has(s.treasure.id))?.treasure;

  return (
    <main className={ui.page}>
      <div>
        <h1>Kiwiana</h1>
        <p className={ui.muted}>Finish units to collect treasures from New Zealand.</p>
      </div>

      <section className={`${ui.card} ${styles.summary}`} aria-label="Collection progress">
        <p className={styles.big}>
          {count} / {TREASURE_COUNT} collected
        </p>
        <p className={styles.rankLine}>
          Rank: <span className={styles.rankChip}>{rankFor(count).name}</span>
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

      {opened && <TreasureDialog treasure={opened} mode="view" onClose={close} />}

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
                    <h2 className={styles.name}>
                      <button type="button" className={styles.nameButton} onClick={() => setOpenId(treasure.id)}>
                        {treasure.name}
                      </button>
                    </h2>
                    <p className={ui.muted}>{treasure.caption}</p>
                    <span className={ui.visuallyHidden}>Opens the story of {treasure.name}.</span>
                  </>
                ) : (
                  <>
                    <h2 className={styles.name} aria-hidden="true">
                      {isNext ? 'Next: ???' : '???'}
                    </h2>
                    <p className={ui.muted} aria-hidden="true">
                      Finish {unit.title} to unlock
                    </p>
                    <span className={ui.visuallyHidden}>
                      {isNext ? 'Next treasure. ' : ''}Locked treasure. Finish {unit.title} to unlock.
                    </span>
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
