import { Link } from 'react-router';
import { unitsForLevel } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { LEVELS } from '../../game/types';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL } from '../labels';
import styles from './Practice.module.css';

/** Free practice: pick any open level, then a game. Unit lessons live on the Path. */
export function Practice() {
  const { openLevels, learned } = useAppData();

  return (
    <main className={ui.page}>
      <div>
        <h1>Free practice</h1>
        <p className={ui.muted}>
          Choose a level, then a game. You will be asked about the units you have opened. To open new units, follow the
          Path.
        </p>
      </div>

      <ul className={styles.list}>
        {LEVELS.map((level) => {
          const levelUnits = unitsForLevel(level);
          const open = openLevels.includes(level);
          const total = levelUnits.reduce((sum, u) => sum + u.itemIds.length, 0);
          const known = levelUnits.reduce((sum, u) => sum + u.itemIds.filter((id) => learned.has(id)).length, 0);

          if (levelUnits.length === 0) {
            return (
              <li key={level} className={`${ui.card} ${styles.locked}`}>
                <h2>{LEVEL_LABEL[level]}</h2>
                <p className={ui.muted}>Coming soon.</p>
              </li>
            );
          }
          if (!open) {
            return (
              <li key={level} className={`${ui.card} ${styles.locked}`}>
                <h2>{LEVEL_LABEL[level]}</h2>
                <p className={ui.muted}>Locked. Open a unit in this level on the Path to use Free practice for it.</p>
              </li>
            );
          }
          return (
            <li key={level}>
              <Link to={`/play/${level}`} className={`${ui.card} ${styles.level}`}>
                <h2>{LEVEL_LABEL[level]}</h2>
                <p className={ui.muted}>
                  <strong>{known}</strong> / {total} items learned
                </p>
                <span className={styles.go}>Choose a game</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
