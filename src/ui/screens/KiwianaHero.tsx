import { useCallback, useState } from 'react';
import { Link } from 'react-router';
import { units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import {
  TREASURE_COUNT,
  nextRank,
  nextTreasureProgress,
  rankFor,
  recentTreasures,
  treasureSlots,
  unlockedTreasureIds,
} from '../../game/treasures';
import { TreasureIcon } from '../components/Treasure';
import { TreasureButton } from '../components/TreasureButton';
import { TreasureDialog } from '../components/TreasureDialog';
import ui from '../components/ui.module.css';
import { formatDate } from '../labels';
import styles from './KiwianaHero.module.css';

const SLOTS = treasureSlots(units);
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The big circular ring with the count in the middle. */
function Ring({ count }: { count: number }) {
  const offset = CIRCUMFERENCE * (1 - count / TREASURE_COUNT);
  return (
    <div className={styles.ring}>
      <svg viewBox="0 0 128 128" width="150" height="150" aria-hidden="true" focusable="false">
        <circle cx="64" cy="64" r={RADIUS} fill="none" stroke="var(--color-grey-200)" strokeWidth="12" />
        <circle
          className={styles.arc}
          cx="64"
          cy="64"
          r={RADIUS}
          fill="none"
          stroke="var(--color-pounamu)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div className={styles.ringText}>
        <span className={styles.ringCount}>
          {count} / {TREASURE_COUNT}
        </span>
        <span className={ui.muted}>collected</span>
      </div>
    </div>
  );
}

/** The top of Progress: the Kiwiana collection as the thing to collect. */
export function KiwianaHero() {
  const { statuses, unitProgress } = useAppData();
  const [openId, setOpenId] = useState<string | null>(null);
  const close = useCallback(() => setOpenId(null), []);
  const [hint, setHint] = useState<string | null>(null);

  const unlocked = unlockedTreasureIds(SLOTS, statuses);
  const count = unlocked.size;
  const rank = rankFor(count);
  const upNext = nextRank(count);
  const progress = nextTreasureProgress(SLOTS, statuses);
  const completedAt = new Map([...unitProgress].map(([id, row]) => [id, row.completed_at]));
  const recent = recentTreasures(SLOTS, statuses, completedAt, 3);
  const opened = SLOTS.find((s) => s.treasure.id === openId && unlocked.has(s.treasure.id))?.treasure;

  return (
    <section className={`${ui.card} ${styles.hero}`} aria-labelledby="your-kiwiana">
      <h2 id="your-kiwiana" className={styles.title}>
        Your Kiwiana
      </h2>

      <Ring count={count} />

      <p className={styles.rank}>
        <span className={styles.rankChip}>{rank.name}</span>
      </p>
      <p className={`${ui.muted} ${styles.rankNext}`}>
        {upNext
          ? `${upNext.needed} more ${upNext.needed === 1 ? 'treasure' : 'treasures'} to become ${upNext.rank.name}`
          : 'You have collected every treasure.'}
      </p>

      {progress && (
        <div className={styles.next}>
          <p className={styles.nextTitle}>Next treasure</p>
          <div
            className={ui.bar}
            role="progressbar"
            aria-label={`Items learned in ${progress.slot.unit.title}`}
            aria-valuemin={0}
            aria-valuemax={progress.total}
            aria-valuenow={progress.learned}
          >
            <div
              className={ui.barFill}
              style={{ width: `${progress.total === 0 ? 0 : (progress.learned / progress.total) * 100}%` }}
            />
          </div>
          <p className={ui.muted}>
            {progress.ready
              ? 'Ready! Take the Kiwiz to unlock'
              : `${progress.slot.unit.title}: ${progress.learned} of ${progress.total} items learned · pass the Kiwiz to unlock`}
          </p>
        </div>
      )}

      <div className={styles.shelfWrap} role="region" aria-label="All 20 kiwiana" tabIndex={0}>
        <ul className={styles.shelf}>
          {SLOTS.map(({ treasure, unit }) => {
            const got = unlocked.has(treasure.id);
            return (
              <li key={treasure.id} className={styles.tile}>
                {got ? (
                  <button
                    type="button"
                    className={styles.tileButton}
                    onClick={() => setOpenId(treasure.id)}
                    aria-label={`Read about ${treasure.name}`}
                  >
                    <TreasureIcon id={treasure.id} size={52} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className={styles.tileButton}
                    onClick={() => setHint(`Finish ${unit.title} to unlock`)}
                  >
                    <TreasureIcon id={treasure.id} size={52} locked />
                    <span className={ui.visuallyHidden}>Locked treasure. Finish {unit.title} to unlock.</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {hint && (
        <p className={styles.hint} role="status">
          {hint}
        </p>
      )}

      {recent.length > 0 && (
        <div className={styles.recent}>
          <h3 className={styles.recentTitle}>Recently unlocked</h3>
          <ul className={styles.recentList}>
            {recent.map(({ slot, date }) => (
              <li key={slot.treasure.id}>
                <TreasureButton treasure={slot.treasure} size={36} className={styles.recentItem}>
                  <span className={styles.recentText}>
                    <strong>{slot.treasure.name}</strong>
                    {date && <span className={ui.muted}>{formatDate(date)}</span>}
                  </span>
                </TreasureButton>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link className={ui.button} to="/kiwiana">
        See all Kiwiana
      </Link>

      {opened && <TreasureDialog treasure={opened} mode="view" onClose={close} />}
    </section>
  );
}
