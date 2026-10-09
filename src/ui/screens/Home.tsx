import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { unitsForLevel, units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { LEVELS, type Level } from '../../game/types';
import { CHECK_SIZE } from '../../game/unitRound';
import type { UnitStatus } from '../../game/unitUnlock';
import { TREASURE_COUNT, nextTreasure, rankFor, treasureAfter, treasureSlots, unlockedTreasureIds, type TreasureSlot } from '../../game/treasures';
import { TitleBreakdown } from '../components/Breakdown';
import { TreasureIcon } from '../components/Treasure';
import { TreasureButton } from '../components/TreasureButton';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL } from '../labels';
import styles from './Home.module.css';

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function statusText(status: UnitStatus): string {
  switch (status.state) {
    case 'locked':
      return 'Locked';
    case 'available':
      return 'Start';
    case 'in_progress':
      return 'Continue';
    case 'complete':
      return 'Complete';
  }
}

const SLOTS = treasureSlots(units);
const GOLDEN = SLOTS[SLOTS.length - 1].treasure;

/** A small, quiet node between unit rows: a grey silhouette until its unit is complete, then the treasure in colour. */
function TreasureNode({ slot, unlocked }: { slot: TreasureSlot; unlocked: boolean }) {
  const [hint, setHint] = useState(false);
  const { treasure, unit } = slot;
  return (
    <li className={styles.treasure}>
      {unlocked ? (
        <TreasureButton treasure={treasure} size={36} className={styles.treasureButton}>
          <span className={styles.treasureName}>{treasure.name}</span>
        </TreasureButton>
      ) : (
        <button type="button" className={styles.treasureButton} onClick={() => setHint(!hint)} aria-expanded={hint}>
          <TreasureIcon id={treasure.id} size={36} locked />
          <span className={styles.treasureName}>{hint ? `Finish ${unit.title} to unlock` : 'Keep going to unlock'}</span>
          <span className={ui.visuallyHidden}>Locked treasure. Finish {unit.title} to unlock.</span>
        </button>
      )}
    </li>
  );
}

function UnitRow({ status, isNext }: { status: UnitStatus; isNext: boolean }) {
  const { unit, state } = status;
  const locked = state === 'locked';
  const detail =
    state === 'complete' && status.bestScore !== null
      ? `Best check ${status.bestScore} / ${CHECK_SIZE}`
      : state === 'in_progress'
        ? `${status.itemsLearned} / ${status.itemsTotal} items learned`
        : null;

  const content = (
    <>
      <span className={`${styles.node} ${styles[state]}`} aria-hidden="true">
        {locked ? <LockIcon /> : state === 'complete' ? <CheckIcon /> : unit.emoji}
      </span>
      <span className={styles.unitBody}>
        <span className={styles.unitTitle}>{unit.title}</span>
        <span className={styles.unitTitleMi} lang="mi">
          {unit.titleMi}
        </span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
      <span className={`${styles.badge} ${styles[`badge_${state}`]}`}>{statusText(status)}</span>
    </>
  );

  return (
    <li className={styles.unitItem}>
      {locked ? (
        <div className={`${styles.unit} ${styles.unitLocked}`} aria-disabled="true">
          {content}
          <span className={ui.visuallyHidden}>Complete another unit to open this one.</span>
        </div>
      ) : (
        <Link
          to={`/unit/${unit.id}`}
          className={`${styles.unit} ${isNext ? styles.unitNext : ''}`}
          aria-label={`${unit.title}, ${statusText(status)}${detail ? `, ${detail}` : ''}`}
        >
          {content}
        </Link>
      )}
    </li>
  );
}

function LevelSection({ level, openIds }: { level: Level; openIds: ReadonlySet<string> }) {
  const { statuses } = useAppData();
  const unlocked = unlockedTreasureIds(SLOTS, statuses);
  const levelUnits = unitsForLevel(level);

  if (levelUnits.length === 0) {
    return (
      <section className={`${ui.card} ${styles.soon}`} aria-labelledby={`level-${level}`}>
        <h2 id={`level-${level}`}>{LEVEL_LABEL[level]}</h2>
        <p className={ui.muted}>Coming soon.</p>
      </section>
    );
  }

  const rows = levelUnits.map((u) => statuses.get(u.id)).filter((s): s is UnitStatus => s !== undefined);
  const complete = rows.filter((s) => s.state === 'complete').length;

  return (
    <section aria-labelledby={`level-${level}`} className={styles.level}>
      <div className={styles.levelHead}>
        <h2 id={`level-${level}`}>{LEVEL_LABEL[level]}</h2>
        <span className={ui.muted}>
          {complete} / {rows.length} units
        </span>
      </div>
      <ol className={styles.path}>
        {rows.flatMap((status) => {
          const slot = treasureAfter(status.unit.id, SLOTS);
          const row = <UnitRow key={status.unit.id} status={status} isNext={openIds.has(status.unit.id)} />;
          return slot
            ? [row, <TreasureNode key={`t-${slot.treasure.id}`} slot={slot} unlocked={unlocked.has(slot.treasure.id)} />]
            : [row];
        })}
      </ol>
    </section>
  );
}

/** Sells the collection: how many are collected, what comes next and what unlocks it. */
function KiwianaCard() {
  const { statuses } = useAppData();
  const count = unlockedTreasureIds(SLOTS, statuses).size;
  const next = nextTreasure(SLOTS, statuses);
  return (
    <section className={`${ui.card} ${styles.kiwianaCard}`} aria-labelledby="kiwiana-title">
      {next ? (
        <TreasureIcon id={next.treasure.id} size={56} locked />
      ) : (
        <TreasureButton treasure={GOLDEN} size={56} className={styles.treasureButton} />
      )}
      <div className={styles.kiwianaText}>
        <h2 id="kiwiana-title">Collect all {TREASURE_COUNT} kiwiana</h2>
        <p className={styles.kiwianaCount}>
          {count} / {TREASURE_COUNT} collected <span className={styles.rankChip}>{rankFor(count).name}</span>
        </p>
        <p className={ui.muted}>{next ? `Finish ${next.unit.title} to unlock it.` : 'All collected.'}</p>
        <Link to="/kiwiana">See your Kiwiana</Link>
      </div>
    </section>
  );
}

export function Home() {
  const { user } = useAuth();
  const { profile, statuses, dueCount } = useAppData();
  const displayName = profile?.display_name ?? user?.email ?? 'learner';

  // The open units that are not complete yet (up to three, in course order).
  const openUnits = units.filter((u) => {
    const state = statuses.get(u.id)?.state;
    return state === 'available' || state === 'in_progress';
  });
  const openIds = new Set(openUnits.map((u) => u.id));
  const allDone = units.every((u) => statuses.get(u.id)?.state === 'complete');

  return (
    <main className={ui.page}>
      <div>
        <h1 className={styles.greeting}>
          Kia ora, <span lang="mi">{displayName}</span>
        </h1>
      </div>

      <KiwianaCard />

      {dueCount > 0 && (
        <section className={`${ui.card} ${styles.reviewCard}`} aria-labelledby="review-title">
          <h2 id="review-title">Review ({dueCount} due)</h2>
          <Link className={ui.button} to="/review">
            Start review
          </Link>
        </section>
      )}

      {openUnits.length > 0 && (
        <section className={`${ui.card} ${styles.nextCard}`} aria-labelledby="next-title">
          <p className={styles.nextLabel} id="next-title">
            Next up
          </p>
          <ul className={styles.nextList}>
            {openUnits.map((next) => (
              <li key={next.id} className={styles.nextItem}>
                <div className={styles.nextText}>
                  <h2 className={styles.nextTitle}>
                    <span aria-hidden="true">{next.emoji} </span>
                    {next.title}
                  </h2>
                  <p className={styles.nextMi} lang="mi">
                    {next.titleMi}
                  </p>
                  <TitleBreakdown unitId={next.id} />
                </div>
                <Link className={ui.button} to={`/unit/${next.id}`} aria-label={`${statuses.get(next.id)?.state === 'in_progress' ? 'Continue' : 'Start'} ${next.title}`}>
                  {statuses.get(next.id)?.state === 'in_progress' ? 'Continue' : 'Start'}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {allDone && (
        <section className={`${ui.card} ${styles.nextCard}`}>
          <h2>
            <span lang="mi">Ka rawe!</span> Every unit is complete
          </h2>
        </section>
      )}

      {LEVELS.map((level) => (
        <LevelSection key={level} level={level} openIds={openIds} />
      ))}

      <section className={ui.card} aria-labelledby="free-title">
        <h2 id="free-title">Free practice</h2>
        <Link className={`${ui.button} ${ui.secondary}`} to="/practice">
          Open free practice
        </Link>
      </section>
    </main>
  );
}
