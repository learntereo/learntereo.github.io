// @vitest-environment jsdom
import type { User } from '@supabase/supabase-js';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { getItem, itemsForUnit, unitsById, units } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import type { RoundRow } from '../../data/roundRepo';
import type { UnitProgressRow } from '../../data/unitProgressRepo';
import { createRound, recordAnswer, serialiseRound } from '../../game/roundState';
import type { Outcome, Question, RoundMode, RoundState } from '../../game/types';
import { computeUnitStatuses, unlockedLevels } from '../../game/unitUnlock';
import { UnitRoundScreen } from './RoundScreen';

const mocks = vi.hoisted(() => ({
  completeRound: vi.fn(async () => {}),
  saveRoundState: vi.fn(async () => {}),
  saveUnitProgress: vi.fn(async () => {}),
  recordAttempts: vi.fn(async () => {}),
  updateProfile: vi.fn(async () => {}),
}));

vi.mock('../../data/roundRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/roundRepo')>()),
  completeRound: mocks.completeRound,
  saveRoundState: mocks.saveRoundState,
}));
vi.mock('../../data/unitProgressRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/unitProgressRepo')>()),
  saveUnitProgress: mocks.saveUnitProgress,
}));
vi.mock('../../data/progressRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/progressRepo')>()),
  recordAttempts: mocks.recordAttempts,
}));
vi.mock('../../data/profileRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/profileRepo')>()),
  updateProfile: mocks.updateProfile,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  Object.values(mocks).forEach((m) => m.mockClear());
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const auth = { user: { id: 'u1', email: 'a@b.c' } as User } as AuthState;
const UNIT_ID = 'b01-greetings';
const unit = unitsById.get(UNIT_ID)!;

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}</p>;
}

/** A check with 12 Translate questions, the first `answered` already played. */
function checkInProgress(answered: number, missedAt: number[]): { state: RoundState; questions: Question[] } {
  const words = itemsForUnit(unit).filter((i) => i.kind === 'word');
  const questions: Question[] = Array.from({ length: 12 }, (_, i) => ({
    mode: 'translate',
    itemIds: [words[i % words.length].id],
    requeued: false,
  }));
  let state = createRound(unit.level, 'unit_check', questions, unit.id);
  for (let i = 0; i < answered; i++) {
    const missed = missedAt.includes(i);
    const outcome: Outcome = {
      result: missed ? 'missed' : 'first',
      requeued: false,
      items: questions[i].itemIds.map((itemId) => ({ itemId, correct: !missed })),
    };
    state = recordAnswer(state, outcome);
  }
  return { state, questions };
}

function row(state: RoundState, mode: RoundMode): RoundRow {
  return {
    id: 'round-1',
    user_id: 'u1',
    level: state.level,
    mode,
    unit_id: UNIT_ID,
    status: 'in_progress',
    state: serialiseRound(state),
    score: null,
    total: 12,
    xp_earned: 0,
    started_at: '2026-10-10T00:00:00Z',
    completed_at: null,
  };
}

function data(activeRound: RoundRow | null, unitProgress: UnitProgressRow[]): AppData {
  const progress = new Map(unitProgress.map((r) => [r.unit_id, r]));
  const statuses = computeUnitStatuses(units, { unitProgress: progress, learned: new Set(), beginnerCompleted: false });
  return {
    status: 'ready',
    profile: {
      id: 'u1',
      display_name: 'Aroha',
      xp: 50,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: null,
      beginner_completed_at: null,
      created_at: '',
      updated_at: '',
    },
    progress: new Map(),
    learned: new Set(),
    unitProgress: progress,
    statuses,
    openLevels: unlockedLevels(units, statuses),
    activeRound,
    reload: async () => {},
    setProfile: vi.fn(),
    setProgress: vi.fn(),
    setUnitProgress: vi.fn(),
    setActiveRound: vi.fn(),
  };
}

const learnedRow: UnitProgressRow = {
  user_id: 'u1',
  unit_id: UNIT_ID,
  learned_at: '2026-10-09T00:00:00Z',
  completed_at: null,
  best_score: null,
  attempts: 0,
};

function renderCheck(appData: AppData, path = `/unit/${UNIT_ID}/check?resume=1`) {
  act(() =>
    root.render(
      <AuthContext.Provider value={auth}>
        <AppDataContext.Provider value={appData}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/unit/:unitId/check" element={<UnitRoundScreen kind="check" />} />
              <Route path="/unit/:unitId" element={<Where />} />
              <Route path="/results/:roundId" element={<Where />} />
              <Route path="/home" element={<Where />} />
            </Routes>
          </MemoryRouter>
        </AppDataContext.Provider>
      </AuthContext.Provider>,
    ),
  );
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

async function answerLastTranslate(state: RoundState, correct: boolean) {
  const question = state.questions[state.index];
  const item = getItem(question.itemIds[0])!;
  const input = container.querySelector('input')!;
  const type = (value: string) =>
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
  const click = (text: string) =>
    act(() => {
      [...container.querySelectorAll('button')]
        .find((b) => b.textContent?.trim() === text)!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  if (correct) {
    type(item.en[0]);
    click('Check');
  } else {
    type('zzzzzzzzzzzzzz');
    click('Check');
    type('qqqqqqqqqqqqqq');
    click('Check');
  }
  click('Continue');
  await flush();
}

describe('unit check round', () => {
  it('passes with 11 of 12: completes the unit, saves the best score and goes to Results', async () => {
    const { state } = checkInProgress(11, [3]);
    const appData = data(row(state, 'unit_check'), [learnedRow]);
    renderCheck(appData);
    await flush();
    expect(container.textContent).toContain('12 / 12');

    await answerLastTranslate(state, true);

    expect(mocks.completeRound).toHaveBeenCalledTimes(1);
    expect(mocks.completeRound).toHaveBeenCalledWith(expect.objectContaining({ id: 'round-1', score: 11 }));
    expect(mocks.saveUnitProgress).toHaveBeenCalledTimes(1);
    expect(mocks.saveUnitProgress).toHaveBeenCalledWith(
      expect.objectContaining({ unit_id: UNIT_ID, best_score: 11, attempts: 1, completed_at: expect.any(String) }),
    );
    expect(appData.setUnitProgress).toHaveBeenCalledWith(expect.objectContaining({ completed_at: expect.any(String) }));
    expect(container.querySelector('[data-testid="where"]')?.textContent).toBe('/results/round-1');

    const finalState = (mocks.completeRound.mock.calls[0] as unknown as [{ state: RoundState }])[0].state;
    expect(finalState.summary?.unitCheck).toMatchObject({
      unitId: UNIT_ID,
      passed: true,
      firstCompletion: true,
      nextUnitId: 'b02-whanau',
    });
    expect(finalState.summary?.missedItemIds).toHaveLength(1);
  });

  it('fails with 9 of 12: counts the attempt, keeps the unit open and lists what was missed', async () => {
    const { state } = checkInProgress(11, [1, 4, 7]);
    const appData = data(row(state, 'unit_check'), [learnedRow]);
    renderCheck(appData);
    await flush();

    await answerLastTranslate(state, false);

    expect(mocks.completeRound).toHaveBeenCalledWith(expect.objectContaining({ score: 8 }));
    const saved = mocks.saveUnitProgress.mock.calls[0] as unknown as [UnitProgressRow];
    expect(saved[0]).toMatchObject({ best_score: 8, attempts: 1, completed_at: null });
    const finalState = (mocks.completeRound.mock.calls[0] as unknown as [{ state: RoundState }])[0].state;
    expect(finalState.summary?.unitCheck).toMatchObject({ passed: false, firstCompletion: false });
    expect(finalState.summary?.unitCheck?.nextUnitId).toBeUndefined();
    expect(finalState.summary?.missedItemIds?.length).toBeGreaterThanOrEqual(3);
  });

  it('does not replay missed questions in a unit check', async () => {
    const { state } = checkInProgress(11, [0, 1]);
    renderCheck(data(row(state, 'unit_check'), [learnedRow]));
    await flush();
    await answerLastTranslate(state, true);
    const finalState = (mocks.completeRound.mock.calls[0] as unknown as [{ state: RoundState }])[0].state;
    expect(finalState.questions).toHaveLength(12);
  });

  it('sends the learner to the unit page when Learn is not done', async () => {
    renderCheck(data(null, []), `/unit/${UNIT_ID}/check`);
    await flush();
    expect(container.querySelector('[data-testid="where"]')?.textContent).toBe(`/unit/${UNIT_ID}`);
  });

  it('sends the learner home when the unit is locked', async () => {
    renderCheck(data(null, []), '/unit/b02-whanau/check');
    await flush();
    expect(container.querySelector('[data-testid="where"]')?.textContent).toBe('/home');
  });
});
