import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { allItems, getItem, getUnit, isKnownItem, itemsById, units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { updateProfile } from '../../data/profileRepo';
import { mergeAttempts, recordAttempts } from '../../data/progressRepo';
import { RoundConflictError, abandonRound, completeRound, getActiveRound, saveRoundState, startRound, type RoundRow } from '../../data/roundRepo';
import { saveQueue } from '../../data/saveQueue';
import { applyCheckResult, emptyUnitProgress, saveUnitProgress } from '../../data/unitProgressRepo';
import { openItems } from '../../game/freePractice';
import { createRng, randomSeed } from '../../game/rng';
import { generateReview } from '../../game/reviewRound';
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
import { REVIEW_LIMIT, applySrs, selectDue } from '../../game/srs';
import { displayStreak, nextStreak, toLocalDateString } from '../../game/streak';
import type { Level, Mode, Outcome, Question, RoundMode, RoundState, RoundSummary, Unit, UnitCheckSummary } from '../../game/types';
import { generateUnitCheck, generateUnitPractice, isPass, missedItemIds } from '../../game/unitRound';
import { computeUnitStatuses, newlyUnlockedUnitIds } from '../../game/unitUnlock';
import { xpForRound } from '../../game/xp';
import { showToast } from '../../lib/toastBus';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL, ROUND_MODE_LABEL, isLevel, isMode } from '../labels';
import { BoardGame } from '../modes/BoardGame';
import { Gap } from '../modes/Gap';
import { Order } from '../modes/Order';
import { Translate } from '../modes/Translate';
import { Write } from '../modes/Write';
import { canResume, roundPath } from '../paths';
import styles from './RoundScreen.module.css';

/** What this screen is playing: a Free Practice game, or a round on one unit. */
type RoundSpec =
  | { kind: 'free'; level: Level; mode: Mode }
  | { kind: 'practice'; unit: Unit }
  | { kind: 'check'; unit: Unit }
  | { kind: 'review' };

function specMode(spec: RoundSpec): RoundMode {
  if (spec.kind === 'free') return spec.mode;
  return spec.kind === 'practice' ? 'unit_practice' : spec.kind === 'check' ? 'unit_check' : 'review';
}

function specLevel(spec: RoundSpec): Level {
  if (spec.kind === 'review') return 'beginner'; // replaced by the level of the first due item
  return spec.kind === 'free' ? spec.level : spec.unit.level;
}

function specUnit(spec: RoundSpec): Unit | undefined {
  return spec.kind === 'free' || spec.kind === 'review' ? undefined : spec.unit;
}

type Phase =
  | { kind: 'starting' }
  | { kind: 'conflict'; existing: RoundRow }
  | { kind: 'playing'; roundId: string; state: RoundState }
  | { kind: 'saving' }
  | { kind: 'error'; message: string; retry?: () => void };

/** Free Practice: #/play/:level/:mode */
export function RoundScreen() {
  const { level, mode } = useParams();
  if (!isLevel(level) || !isMode(mode)) return <Navigate to="/practice" replace />;
  return <Round key={`${level}/${mode}`} spec={{ kind: 'free', level, mode }} />;
}

/** Unit practice and unit check: #/unit/:unitId/practice and #/unit/:unitId/check */
export function UnitRoundScreen({ kind }: { kind: 'practice' | 'check' }) {
  const { unitId } = useParams();
  const { statuses, activeRound } = useAppData();
  const [search] = useSearchParams();
  const unit = getUnit(unitId);
  const status = unit ? statuses.get(unit.id) : undefined;
  // A round the learner already started on this unit can always be resumed, even if the unit's state has changed since.
  const resumingOwn =
    unit !== undefined &&
    search.get('resume') === '1' &&
    activeRound?.unit_id === unit.id &&
    activeRound.mode === (kind === 'practice' ? 'unit_practice' : 'unit_check');
  if (!unit || !status) return <Navigate to="/home" replace />;
  if (status.state === 'locked' && !resumingOwn) return <Navigate to="/home" replace />;
  // The check comes after Learn (units already complete from earlier progress can skip it).
  if (kind === 'check' && !status.deckDone && status.state !== 'complete' && !resumingOwn) {
    return <Navigate to={`/unit/${unit.id}`} replace />;
  }
  return <Round key={`${kind}/${unit.id}`} spec={{ kind, unit }} />;
}

/** Review: up to 15 items that are due, most overdue first (#/review). */
export function ReviewScreen() {
  const { dueCount, activeRound } = useAppData();
  // Frozen when the screen opens, so finishing a round does not flip this screen to "all caught up".
  const [dueAtStart] = useState(dueCount);
  // Any unfinished review round is shown (to resume or replace), even when nothing is due any more.
  const resuming = activeRound?.mode === 'review';
  if (dueAtStart === 0 && !resuming) {
    return (
      <main className={ui.page}>
        <section className={ui.card}>
          <h1>
            <span lang="mi">Kua oti!</span> All caught up
          </h1>
          <p className={ui.muted}>Nothing is due for review right now. Words come back after a day or more, depending on how well you know them.</p>
          <Link className={ui.button} to="/home">
            Back to the Path
          </Link>
        </section>
      </main>
    );
  }
  return <Round key="review" spec={{ kind: 'review' }} />;
}

function Round({ spec }: { spec: RoundSpec }) {
  const level = specLevel(spec);
  const roundMode = specMode(spec);
  const unit = specUnit(spec);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const data = useAppData();
  const { profile, progress, learned, activeRound, openLevels, statuses, unitProgress } = data;
  const [phase, setPhase] = useState<Phase>({ kind: 'starting' });
  const started = useRef(false);

  const exitTo = unit ? `/unit/${unit.id}` : spec.kind === 'review' ? '/home' : '/practice';
  const matches = (row: RoundRow) =>
    row.mode === roundMode &&
    (row.unit_id ?? null) === (unit?.id ?? null) &&
    (spec.kind !== 'free' || row.level === level);
  const resumingOwn = search.get('resume') === '1' && activeRound !== null && matches(activeRound);
  const levelOpen = unit !== undefined || openLevels.includes(level) || resumingOwn;

  function buildQuestions(): Question[] {
    const rng = createRng(randomSeed());
    if (spec.kind === 'practice') return generateUnitPractice(spec.unit, units, allItems, learned, rng);
    if (spec.kind === 'check') return generateUnitCheck(spec.unit, allItems, rng);
    if (spec.kind === 'review') {
      const due = selectDue(progress.values(), toLocalDateString(new Date()), REVIEW_LIMIT, isKnownItem);
      return generateReview(
        due.map((row) => itemsById.get(row.item_id)!),
        allItems,
        rng,
      );
    }
    return generateRound(openItems(allItems, units, statuses), spec.level, spec.mode, learned, rng);
  }

  async function finish(roundId: string, state: RoundState) {
    if (!user || !profile) {
      setPhase({ kind: 'error', message: 'We could not load your profile to finish this round. Please try again.', retry: () => void finish(roundId, state) });
      return;
    }
    setPhase({ kind: 'saving' });

    const now = new Date();
    const nowIso = now.toISOString();
    const xp = xpForRound(state.outcomes);
    const score = scoreOf(state);

    const attempts = state.outcomes.flatMap((o) => o.items);
    const rows = applySrs(mergeAttempts(user.id, progress, attempts, nowIso), state.outcomes, toLocalDateString(now));
    const nowLearned = new Set(learned);
    for (const row of rows) if (row.first_correct_at) nowLearned.add(row.item_id);
    const newlyLearned = [...nowLearned].filter((id) => !learned.has(id)).length;

    const streak = nextStreak(profile, toLocalDateString(now));
    const patch = {
      xp: profile.xp + xp,
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      last_active_date: streak.last_active_date,
    };

    // A unit check records the attempt, the best score and, on a pass, completion.
    let unitCheck: UnitCheckSummary | undefined;
    if (state.mode === 'unit_check' && unit) {
      const passed = isPass(score, state.originalCount);
      const existing = unitProgress.get(unit.id) ?? emptyUnitProgress(user.id, unit.id);
      const updated = applyCheckResult(existing, score, passed, nowIso);
      const after = computeUnitStatuses(units, {
        unitProgress: new Map(unitProgress).set(unit.id, updated),
        learned: nowLearned,
        beginnerCompleted: Boolean(profile.beginner_completed_at),
      });
      unitCheck = {
        unitId: unit.id,
        passed,
        firstCompletion: passed && statuses.get(unit.id)?.state !== 'complete',
        nextUnitId: newlyUnlockedUnitIds(statuses, after)[0],
      };
      data.setUnitProgress(updated);
      void saveQueue.enqueue(`unit:${unit.id}`, () => saveUnitProgress(updated));
    }

    const summary: RoundSummary = {
      newlyLearned,
      streak: streak.current_streak,
      ...(unit ? { missedItemIds: missedItemIds(state) } : {}),
      ...(unitCheck ? { unitCheck } : {}),
    };
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
      unit_id: state.unitId ?? null,
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
    try {
      await saveQueue.enqueue(`round:${roundId}`, () => completeRound({ id: roundId, state: finalState, score, xpEarned: xp }));
    } catch (error) {
      // The results are already shown from local state; the save is retried in the background by the queue.
      console.error('Could not save the finished round', error);
    }

    navigate(`/results/${roundId}`, { replace: true, state: { round: completed } });
  }

  // ---- starting / resuming -------------------------------------------------

  async function startFresh() {
    if (!user) return;
    setPhase({ kind: 'starting' });
    try {
      const questions = buildQuestions();
      if (questions.length === 0) throw new Error('Nothing to ask');
      // A review mixes levels; it is filed under the level of its first item.
      const roundLevel = spec.kind === 'review' ? (getItem(questions[0].itemIds[0])?.level ?? level) : level;
      const state = createRound(roundLevel, roundMode, questions, unit?.id);
      const row = await startRound(user.id, roundLevel, roundMode, serialiseRound(state), unit?.id ?? null);
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
    // Wait for the learner's profile too: finishing a round needs it.
    if (started.current || !user || !profile || !levelOpen) return;
    started.current = true;
    const wantsResume = search.get('resume') === '1';
    const sameRound = activeRound !== null && matches(activeRound);
    // Start-up work depends on loaded data and runs exactly once per visit.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (activeRound && wantsResume && sameRound) {
      void resume(activeRound);
    } else if (activeRound) {
      setPhase({ kind: 'conflict', existing: activeRound });
    } else {
      void startFresh();
    }
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  // ---- answering and finishing --------------------------------------------

  function handleDone(roundId: string, state: RoundState, outcome: Outcome) {
    const next = recordAnswer(state, outcome);
    if (isRoundComplete(next)) {
      setPhase({ kind: 'saving' });
      void finish(roundId, next);
      return;
    }
    setPhase({ kind: 'playing', roundId, state: next });
    // Keep the shared copy current, so Resume from Home continues from here.
    if (activeRound?.id === roundId) data.setActiveRound({ ...activeRound, state: serialiseRound(next) });
    // Save after every answered question. Gameplay never waits on the network.
    void saveQueue.enqueue(`round:${roundId}`, () => saveRoundState(roundId, serialiseRound(next)));
  }

  // ---- render ----------------------------------------------------------------

  if (!levelOpen) return <Navigate to="/practice" replace />;

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
            <button type="button" className={ui.button} onClick={() => (phase.retry ? phase.retry() : void startFresh())}>
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
    const existingUnit = getUnit(existing.unit_id ?? undefined);
    return (
      <main className={ui.page}>
        <section className={ui.card} aria-labelledby="conflict-title">
          <h1 id="conflict-title">Round in progress</h1>
          <p>
            You have an unfinished {existingUnit ? `${existingUnit.title} ` : `${LEVEL_LABEL[existing.level]} `}
            {ROUND_MODE_LABEL[existing.mode]} round (question {Math.min(existingIndex + 1, existing.total)} of{' '}
            {existing.total}). Resume it, or start a new round and leave the old one behind?
          </p>
          <div className={ui.row}>
            {canResume(existing) && (
              <button
                type="button"
                className={ui.button}
                onClick={() => {
                  // Already on this round's screen: continue it here (navigating to the same address would do nothing).
                  if (matches(existing)) void resume(existing);
                  else navigate(roundPath(existing, true), { replace: true });
                }}
              >
                Resume round
              </button>
            )}
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
    level: state.level,
    // A unit check never points out the right spot on a board.
    hints: state.mode !== 'unit_check',
    onDone: (outcome: Outcome) => handleDone(roundId, state, outcome),
  };

  return (
    <main className={ui.page}>
      <div className={styles.top}>
        <Link to={exitTo} className={styles.exit}>
          Save and exit
        </Link>
        <span className={ui.muted}>
          {spec.kind === 'review' ? 'Review' : `${unit ? unit.title : LEVEL_LABEL[level]} · ${ROUND_MODE_LABEL[roundMode]}`}
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
      ) : question.mode === 'write' ? (
        <Write key={state.index} {...modeProps} />
      ) : question.mode === 'gap' ? (
        <Gap key={state.index} {...modeProps} />
      ) : (
        <Order key={state.index} {...modeProps} />
      )}
    </main>
  );
}
