import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { useAppData } from '../../data/AppDataContext';
import { allItems } from '../../content/content';
import { levelProgress } from '../../game/unlock';
import type { Level } from '../../game/types';
import { KowhaiwhaiBorder } from '../components/Kowhaiwhai';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, MODE_LABEL, isLevel, isMode } from '../labels';
import styles from './Home.module.css';

function LevelCard({ level, locked }: { level: Level; locked: boolean }) {
  const { learned } = useAppData();
  const { learned: done, total } = levelProgress(allItems, level, learned);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <section className={`${ui.card} ${locked ? styles.locked : ''}`} aria-labelledby={`level-${level}`}>
      <div className={styles.levelHead}>
        <h2 id={`level-${level}`}>{LEVEL_LABEL[level]}</h2>
        {locked && (
          <span className={styles.lock}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Z"
              />
            </svg>
            Locked
          </span>
        )}
      </div>

      {locked ? (
        <p className={ui.muted}>Complete Beginner to unlock</p>
      ) : (
        <>
          <p className={ui.muted}>
            <strong>{done}</strong> / {total} items learned
          </p>
          <div
            className={ui.bar}
            role="progressbar"
            aria-label={`${LEVEL_LABEL[level]} progress`}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
          >
            <div className={ui.barFill} style={{ width: `${percent}%` }} />
          </div>
          <Link className={`${ui.button} ${styles.play}`} to={`/play/${level}`}>
            {done === 0 ? 'Start' : 'Practise'}
          </Link>
        </>
      )}
    </section>
  );
}

export function Home() {
  const { user } = useAuth();
  const { profile, activeRound, intermediateUnlocked } = useAppData();
  const displayName = profile?.display_name ?? user?.email ?? 'learner';

  const resumeIndex =
    activeRound && typeof activeRound.state === 'object' && activeRound.state !== null
      ? Number((activeRound.state as { index?: unknown }).index ?? 0)
      : 0;
  const resumable = activeRound && isLevel(activeRound.level) && isMode(activeRound.mode);

  return (
    <main className={ui.page}>
      <div>
        <h1 className={styles.greeting}>
          Kia ora, <span lang="mi">{displayName}</span>
        </h1>
        <p className={ui.muted}>Pick a level and a way to practise.</p>
      </div>

      <KowhaiwhaiBorder height={20} />

      {resumable && (
        <section className={`${ui.card} ${styles.resume}`} aria-labelledby="resume-title">
          <h2 id="resume-title">Resume round</h2>
          <p className={ui.muted}>
            {LEVEL_LABEL[activeRound.level]} &middot; {MODE_LABEL[activeRound.mode]} &middot; question{' '}
            {Math.min(resumeIndex + 1, activeRound.total)} of {activeRound.total}
          </p>
          <Link className={ui.button} to={`/play/${activeRound.level}/${activeRound.mode}?resume=1`}>
            Resume round
          </Link>
        </section>
      )}

      <LevelCard level="beginner" locked={false} />
      <LevelCard level="intermediate" locked={!intermediateUnlocked} />
    </main>
  );
}
