import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAppData } from '../../data/AppDataContext';
import { getHistory, type RoundRow } from '../../data/roundRepo';
import { getUnit, totalItemCount, units, unitsForLevel } from '../../content/content';
import { TREASURE_COUNT, treasureSlots, unlockedTreasureIds } from '../../game/treasures';
import { LEVELS } from '../../game/types';
import { displayStreak, toLocalDateString } from '../../game/streak';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, ROUND_MODE_LABEL, formatDate } from '../labels';
import { KiwianaHero } from './KiwianaHero';
import styles from './Progress.module.css';

export function Progress() {
  const { profile, learned, statuses, dueCount } = useAppData();
  const unitsComplete = units.filter((u) => statuses.get(u.id)?.state === 'complete').length;
  const slots = treasureSlots(units);
  const unlocked = unlockedTreasureIds(slots, statuses);
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

      <KiwianaHero />

      <div className={styles.stats}>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>{profile?.xp ?? 0}</span>
          <span className={ui.muted}>Total Kiwi XP</span>
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
            <span className={styles.of}> / {totalItemCount}</span>
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
        <Link to="/kiwiana" className={`${ui.card} ${styles.stat} ${styles.statLink}`}>
          <span className={styles.value}>
            {unlocked.size}
            <span className={styles.of}> / {TREASURE_COUNT}</span>
          </span>
          <span className={ui.muted}>Kiwiana</span>
        </Link>
        <div className={`${ui.card} ${styles.stat}`}>
          <span className={styles.value}>{dueCount}</span>
          <span className={ui.muted}>Due for review</span>
        </div>
      </div>

      <section aria-labelledby="levels-title">
        <h2 id="levels-title">By level</h2>
        <ul className={styles.list}>
          {LEVELS.map((level) => {
            const levelUnits = unitsForLevel(level);
            if (levelUnits.length === 0) return null;
            const complete = levelUnits.filter((u) => statuses.get(u.id)?.state === 'complete').length;
            const total = levelUnits.reduce((n, u) => n + u.itemIds.length, 0);
            const known = levelUnits.reduce((n, u) => n + u.itemIds.filter((id) => learned.has(id)).length, 0);
            return (
              <li key={level} className={`${ui.card} ${styles.levelStat}`}>
                <strong>{LEVEL_LABEL[level]}</strong>
                <span className={ui.muted}>
                  {complete} / {levelUnits.length} units complete
                </span>
                <span className={ui.muted}>
                  {known} / {total} items learned
                </span>
                <div
                  className={ui.bar}
                  style={{ marginTop: 8 }}
                  role="progressbar"
                  aria-label={`${LEVEL_LABEL[level]} items learned`}
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={known}
                >
                  <div className={ui.barFill} style={{ width: `${total === 0 ? 0 : Math.round((known / total) * 100)}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="history-title">
        <h2 id="history-title">Recent rounds</h2>
        {failed && <p>We could not load your history. Please try again later.</p>}
        {!failed && history === null && <p role="status">Loading...</p>}
        {history && history.length === 0 && <p className={ui.muted}>No rounds yet.</p>}
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
                  <div className={ui.muted}>+{round.xp_earned} Kiwi XP</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
