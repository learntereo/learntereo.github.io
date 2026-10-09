import { useEffect, useState } from 'react';
import { useAppData } from '../../data/AppDataContext';
import { getHistory, type RoundRow } from '../../data/roundRepo';
import { allItems, getUnit, units } from '../../content/content';
import { displayStreak, toLocalDateString } from '../../game/streak';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, ROUND_MODE_LABEL, formatDate } from '../labels';
import styles from './Progress.module.css';

export function Progress() {
  const { profile, learned, statuses } = useAppData();
  const unitsComplete = units.filter((u) => statuses.get(u.id)?.state === 'complete').length;
  const [history, setHistory] = useState<RoundRow[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getHistory(20)
      .then((rows) => {
        if (!cancelled) setHistory(rows);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const streak = profile ? displayStreak(profile, toLocalDateString(new Date())) : 0;

  return (
    <main className={ui.page}>
      <h1>Your progress</h1>

      <div className={styles.stats}>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>{profile?.xp ?? 0}</span>
          <span className={ui.muted}>Total XP</span>
        </div>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>{streak}</span>
          <span className={ui.muted}>Day streak</span>
        </div>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>{profile?.longest_streak ?? 0}</span>
          <span className={ui.muted}>Best streak</span>
        </div>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>
            {learned.size}
            <span className={styles.of}> / {allItems.length}</span>
          </span>
          <span className={ui.muted}>Items learned</span>
        </div>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>
            {unitsComplete}
            <span className={styles.of}> / {units.length}</span>
          </span>
          <span className={ui.muted}>Units complete</span>
        </div>
      </div>

      <section aria-labelledby="history-title">
        <h2 id="history-title">Recent rounds</h2>
        {failed && <p>We could not load your history. Please try again later.</p>}
        {!failed && history === null && <p role="status">Loading...</p>}
        {history && history.length === 0 && <p className={ui.muted}>No rounds yet. Play one to see it here.</p>}
        {history && history.length > 0 && (
          <ul className={styles.list}>
            {history.map((round) => (
              <li key={round.id} className={`${ui.card} ${styles.item}`}>
                <div>
                  <strong>
                    {getUnit(round.unit_id ?? undefined)?.title ?? LEVEL_LABEL[round.level]} &middot;{' '}
                    {ROUND_MODE_LABEL[round.mode]}
                  </strong>
                  <div className={ui.muted}>{formatDate(round.completed_at)}</div>
                </div>
                <div className={styles.score}>
                  <strong>
                    {round.score ?? 0} / {round.total}
                  </strong>
                  <div className={ui.muted}>+{round.xp_earned} XP</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
