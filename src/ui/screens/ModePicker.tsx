import { Link, Navigate, useParams } from 'react-router';
import { allItems, units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { availableModes, openItems } from '../../game/freePractice';
import { MODES } from '../../game/types';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, MODE_LABEL, isLevel } from '../labels';
import styles from './ModePicker.module.css';

export function ModePicker() {
  const { level } = useParams();
  const { openLevels, statuses } = useAppData();

  if (!isLevel(level)) return <Navigate to="/practice" replace />;
  if (!openLevels.includes(level)) return <Navigate to="/practice" replace />;

  const available = availableModes(openItems(allItems, units, statuses), level);

  return (
    <main className={ui.page}>
      <div>
        <Link to="/practice" className={styles.back}>
          &larr; Free practice
        </Link>
        <h1>{LEVEL_LABEL[level]}</h1>
      </div>

      <ul className={styles.list}>
        {MODES.map((mode) =>
          available.includes(mode) ? (
            <li key={mode}>
              <Link to={`/play/${level}/${mode}`} className={`${ui.card} ${styles.mode}`}>
                <span className={styles.modeName}>{MODE_LABEL[mode]}</span>
              </Link>
            </li>
          ) : (
            <li key={mode}>
              <div className={`${ui.card} ${styles.mode} ${styles.unavailable}`} aria-disabled="true">
                <span className={styles.modeName}>{MODE_LABEL[mode]}</span>
                <span className={ui.muted}>Locked</span>
              </div>
            </li>
          ),
        )}
      </ul>
    </main>
  );
}
