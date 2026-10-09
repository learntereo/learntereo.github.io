import { Link, Navigate, useParams } from 'react-router';
import { useAppData } from '../../data/AppDataContext';
import { MODES } from '../../game/types';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, MODE_DESCRIPTION, MODE_LABEL, isLevel } from '../labels';
import styles from './ModePicker.module.css';

export function ModePicker() {
  const { level } = useParams();
  const { intermediateUnlocked, activeRound } = useAppData();

  if (!isLevel(level)) return <Navigate to="/home" replace />;
  if (level === 'intermediate' && !intermediateUnlocked) return <Navigate to="/home" replace />;

  return (
    <main className={ui.page}>
      <div>
        <Link to="/home" className={styles.back}>
          &larr; Home
        </Link>
        <h1>{LEVEL_LABEL[level]}</h1>
        <p className={ui.muted}>Choose how you want to practise. Each round has 10 questions.</p>
      </div>

      {activeRound && (
        <p className={styles.notice} role="note">
          You have a round in progress. Starting a new one will ask whether to resume it or start over.
        </p>
      )}

      <ul className={styles.list}>
        {MODES.map((mode) => (
          <li key={mode}>
            <Link to={`/play/${level}/${mode}`} className={`${ui.card} ${styles.mode}`}>
              <span className={styles.modeName}>{MODE_LABEL[mode]}</span>
              <span className={ui.muted}>{MODE_DESCRIPTION[mode]}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
