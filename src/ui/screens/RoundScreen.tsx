import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { allItems } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { updateProfile } from '../../data/profileRepo';
import { mergeAttempts, recordAttempts } from '../../data/progressRepo';
import { RoundConflictError, abandonRound, completeRound, getActiveRound, saveRoundState, startRound, type RoundRow } from '../../data/roundRepo';
import { saveQueue } from '../../data/saveQueue';
import { createRng, randomSeed } from '../../game/rng';
import { generateRound } from '../../game/roundGenerator';
import {
  createRound,
  currentQuestion,
  isRoundComplete,
  progressOf,
  recordAnswer,
  scoreOf,
  serialiseRound,
  validateRoundState,
} from '../../game/roundState';
import { displayStreak, nextStreak, toLocalDateString } from '../../game/streak';
import type { Level, Mode, Outcome, RoundState, RoundSummary } from '../../game/types';
import { isBeginnerComplete } from '../../game/unlock';
import { xpForRound } from '../../game/xp';
import { itemsById } from '../../content/content';
import { showToast } from '../../lib/toastBus';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, MODE_LABEL, isLevel, isMode } from '../labels';
import { BoardGame } from '../modes/BoardGame';
import { Order } from '../modes/Order';
import { Translate } from '../modes/Translate';
import styles from './RoundScreen.module.css';

type Phase =
  | { kind: 'starting' }
  | { kind: 'conflict'; existing: RoundRow }
  | { kind: 'playing'; roundId: string; state: RoundState }
  | { kind: 'saving' }
  | { kind: 'error'; message: string };

export function RoundScreen() {
  const { level, mode } = useParams();
  if (!isLevel(level) || !isMode(mode)) return <Navigate to="/home" replace />;
  return <Round level={level} mode={mode} />;
}

function Round({ level, mode }: { level: Level; mode: Mode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const data = useAppData();
  const { profile, progress, learned, activeRound, intermediateUnlocked } = data;
  const [phase, setPhase] = useState<Phase>({ kind: 'starting' });
  const started = useRef(false);

  async function finish(roundId: string, state: RoundState) {
    if (!user || !profile) return;
    setPhase({ kind: 'saving' });

    const now = new Date();
    const nowIso = now.toISOString();
    const xp = xpForRound(state.outcomes);
    const score = scoreOf(state);

    const attempts = state.outcomes.flatMap((o) => o.items);
    const rows = mergeAttempts(user.id, progress, attempts, nowIso);
    const nowLearned = new Set(learned);
    for (const row of rows) if (row.first_correct_at) nowLearned.add(row.item_id);
    const newlyLearned = [...nowLearned].filter((id) => !learned.has(id)).length;

    const streak = nextStreak(profile, toLocalDateString(now));
    const unlockedIntermediate = !profile.beginner_completed_at && isBeginnerComplete(allItems, nowLearned);
    const patch = {
      xp: profile.xp + xp,
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_active_date: streak.last_active_date,
      ...(unlockedIntermediate ? { beginner_completed_at: nowIso } : {}),
    };

    const summary: RoundSummary = { newlyLearned, unlockedIntermediate, streak: streak.current_streak };
    const finalState: RoundState = serialiseRound({ ...state, summary });

    // Update what the app shows right away, then persist (retried in the background).
    data.setProfile({ ...profile, ...patch });
    data.setProgress(rows);
    data.setActiveRound(null);

    const completed: RoundRow = {
      id: roundId,
      user_id: user.id,
      level: state.level,
      mode: state.mode,
      status: 'completed',
      state: finalState,
      score,
      total: state.originalCount,
      xp_earned: xp,
      started_at: nowIso,
      completed_at: nowIso,
    };

    void saveQueue.enqueue(`progress:${roundId}`, () => recordAttempts(rows));
    void saveQueue.enqueue(`profile:${user.id}`, () => updateProfile(user.id, patch));
    await saveQueue.enqueue(`round:${roundId}`, () => completeRound({ id: roundId, state: finalState, score, xpEarned: xp }));

    navigate(`/results/${roundId}`, { replace: true, state: { round: completed } });
  }

  // ---- starting / resuming -------------------------------------------------

  async function startFresh() {
    if (!user) return;
    setPhase({ kind: 'starting' });
    try {
      const questions = generateRound(allItems, level, mode, learned, createRng(randomSeed()));
      const state = createRound(level, mode, questions);
      const row = await startRound(user.id, level, mode, serialiseRound(state));
      data.setActiveRound(row);
      setPhase({ kind: 'playing', roundId: row.id, state });
    } catch (error) {
      if (error instanceof RoundConflictError) {
        try {
          const existing = await getActiveRound();
          if (existing) {
            data.setActiveRound(existing);
            setPhase({ kind: 'conflict', existing });
            return;
          }
        } catch {
          // fall through to the error below
        }
      }
      console.error('Could not start a round', error);
      setPhase({ kind: 'error', message: 'We could not start a round. Please check your connection and try again.' });
    }
  }

  async function resume(row: RoundRow) {
    const state = validateRoundState(row.state, itemsById);
    if (!state) {
      try {
        await abandonRound(row.id);
      } catch (error) {
        console.error('Could not discard the old round', error);
      }
      data.setActiveRound(null);
      showToast("We couldn't resume that round, so we've started a fresh one.", 'info');
      await startFresh();
      return;
    }
    if (isRoundComplete(state)) {
      await finish(row.id, state);
      return;
    }
    setPhase({ kind: 'playing', roundId: row.id, state });
  }

  async function discardAndStart(row: RoundRow) {
    try {
      await abandonRound(row.id);
    } catch (error) {
      console.error('Could not abandon the old round', error);
      setPhase({ kind: 'error', message: 'We could not clear your old round. Please try again.' });
      return;
    }
    data.setActiveRound(null);
    await startFresh();
  }

  useEffect(() => {
    if (started.current || !user) return;
    if (level === 'intermediate' && !intermediateUnlocked) return;
    started.current = true;
    const wantsResume = search.get('resume') === '1';
    // Start-up work depends on loaded data and runs exactly once per visit.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (activeRound && wantsResume && activeRound.level === level && activeRound.mode === mode) {
      void resume(activeRound);
    } else if (activeRound) {
      setPhase({ kind: 'conflict', existing: activeRound });
    } else {
      void startFresh();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ---- answering and finishing --------------------------------------------

  function handleDone(roundId: string, state: RoundState, outcome: Outcome) {
    const next = recordAnswer(state, outcome);
    if (isRoundComplete(next)) {
      setPhase({ kind: 'saving' });
      void finish(roundId, next);
      return;
    }
    setPhase({ kind: 'playing', roundId, state: next });
    // Save after every answered question. Gameplay never waits on the network.
    void saveQueue.enqueue(`round:${roundId}`, () => saveRoundState(roundId, serialiseRound(next)));
  }

  // ---- render ----------------------------------------------------------------

  if (level === 'intermediate' && !intermediateUnlocked) return <Navigate to="/home" replace />;

  if (phase.kind === 'starting' || phase.kind === 'saving') {
    return (
      <main className={ui.page}>
        <p role="status">{phase.kind === 'saving' ? 'Saving your round...' : 'Getting your round ready...'}</p>
      </main>
    );
  }

  if (phase.kind === 'error') {
    return (
      <main className={ui.page}>
        <div className={ui.card}>
          <h1>Something went wrong</h1>
          <p>{phase.message}</p>
          <div className={ui.row}>
            <button type="button" className={ui.button} onClick={() => void startFresh()}>
              Try again
            </button>
            <Link className={`${ui.button} ${ui.secondary}`} to="/home">
              Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (phase.kind === 'conflict') {
    const existing = phase.existing;
    const existingIndex = Number((existing.state as { index?: unknown } | null)?.index ?? 0);
    return (
      <main className={ui.page}>
        <section className={ui.card} aria-labelledby="conflict-title">
          <h1 id="conflict-title">Round in progress</h1>
          <p>
            You have an unfinished {LEVEL_LABEL[existing.level]} {MODE_LABEL[existing.mode]} round (question{' '}
            {Math.min(existingIndex + 1, existing.total)} of {existing.total}). Resume it, or start a new round and
            leave the old one behind?
          </p>
          <div className={ui.row}>
            <button
              type="button"
              className={ui.button}
              onClick={() => navigate(`/play/${existing.level}/${existing.mode}?resume=1`, { replace: true })}
            >
              Resume round
            </button>
            <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => void discardAndStart(existing)}>
              Start a new round
            </button>
          </div>
          <p className={styles.back}>
            <Link to="/home">Back to Home</Link>
          </p>
        </section>
      </main>
    );
  }

  const { roundId, state } = phase;
  const question = currentQuestion(state);
  if (!question) return null;
  const progressInfo = progressOf(state);
  const label = progressInfo.review
    ? `Review ${progressInfo.reviewPosition} of ${progressInfo.reviewTotal}`
    : `${progressInfo.position} / ${progressInfo.total}`;
  const percent = progressInfo.review ? 100 : Math.round(((progressInfo.position - 1) / progressInfo.total) * 100);
  const streakNow = profile ? displayStreak(profile, toLocalDateString(new Date())) : 0;

  const modeProps = {
    question,
    level,
    onDone: (outcome: Outcome) => handleDone(roundId, state, outcome),
  };

  return (
    <main className={ui.page}>
      <div className={styles.top}>
        <Link to="/home" className={styles.exit}>
          Save and exit
        </Link>
        <span className={ui.muted}>
          {LEVEL_LABEL[level]} &middot; {MODE_LABEL[mode]}
        </span>
      </div>

      <div
        className={ui.bar}
        role="progressbar"
        aria-label="Round progress"
        aria-valuemin={0}
        aria-valuemax={progressInfo.total}
        aria-valuenow={progressInfo.review ? progressInfo.total : progressInfo.position - 1}
        aria-valuetext={label}
      >
        <div className={ui.barFill} style={{ width: `${percent}%` }} />
      </div>
      <p className={styles.count} aria-hidden="true">
        {label}
        <span className={styles.streak}> &middot; {streakNow} day streak</span>
      </p>

      {question.mode === 'match' || question.mode === 'picture' ? (
        <BoardGame key={state.index} {...modeProps} />
      ) : question.mode === 'translate' ? (
        <Translate key={state.index} {...modeProps} />
      ) : (
        <Order key={state.index} {...modeProps} />
      )}
    </main>
  );
}
