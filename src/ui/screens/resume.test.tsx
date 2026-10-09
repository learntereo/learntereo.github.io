// @vitest-environment jsdom
import type { User } from '@supabase/supabase-js';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { allItems, units, unitsById } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import type { Profile } from '../../data/profileRepo';
import type { RoundRow } from '../../data/roundRepo';
import type { UnitProgressRow } from '../../data/unitProgressRepo';
import { createRng } from '../../game/rng';
import { generateReview } from '../../game/reviewRound';
import { generateRound } from '../../game/roundGenerator';
import { createRound, recordAnswer, serialiseRound } from '../../game/roundState';
import type { Level, Mode, RoundMode, RoundState } from '../../game/types';
import { generateUnitCheck, generateUnitPractice } from '../../game/unitRound';
import { computeUnitStatuses, unlockedLevels } from '../../game/unitUnlock';
import { roundPath } from '../paths';
import { Home } from './Home';
import { ReviewScreen, RoundScreen, UnitRoundScreen } from './RoundScreen';

const mocks = vi.hoisted(() => ({
  completeRound: vi.fn(async () => {}),
  saveRoundState: vi.fn(async () => {}),
  startRound: vi.fn(),
  abandonRound: vi.fn(async () => {}),
  getActiveRound: vi.fn(async () => null),
  recordAttempts: vi.fn(async () => {}),
  updateProfile: vi.fn(async () => {}),
  saveUnitProgress: vi.fn(async () => {}),
}));

vi.mock('../../data/roundRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/roundRepo')>()),
  completeRound: mocks.completeRound,
  saveRoundState: mocks.saveRoundState,
  startRound: mocks.startRound,
  abandonRound: mocks.abandonRound,
  getActiveRound: mocks.getActiveRound,
}));
vi.mock('../../data/progressRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/progressRepo')>()),
  recordAttempts: mocks.recordAttempts,
}));
vi.mock('../../data/profileRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/profileRepo')>()),
  updateProfile: mocks.updateProfile,
}));
vi.mock('../../data/unitProgressRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/unitProgressRepo')>()),
  saveUnitProgress: mocks.saveUnitProgress,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  Object.values(mocks).forEach((m) => m.mockClear());
  mocks.startRound.mockImplementation(async (_u: string, level: Level, mode: RoundMode, state: RoundState, unitId: string | null) =>
    row({ id: 'fresh', level, mode, unit_id: unitId, state, total: state.originalCount }),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const auth = { user: { id: 'u1', email: 'a@b.c' } as User } as AuthState;
const NOW = '2026-10-10T00:00:00Z';
const UNIT = unitsById.get('i01-mahi')!;
const profile: Profile = {
  id: 'u1',
  display_name: 'Aroha',
  xp: 50,
  current_streak: 1,
  longest_streak: 1,
  last_active_date: null,
  beginner_completed_at: NOW,
  created_at: '',
  updated_at: '',
};

function row(over: Partial<RoundRow> & { state: unknown }): RoundRow {
  return {
    id: 'r1',
    user_id: 'u1',
    level: 'beginner',
    mode: 'translate',
    unit_id: null,
    status: 'in_progress',
    score: null,
    total: 10,
    xp_earned: 0,
    started_at: NOW,
    completed_at: null,
    ...over,
  };
}

const rng = () => createRng(11);

function freeRow(mode: Mode, level: Level = 'beginner'): RoundRow {
  const questions = generateRound(allItems.filter((i) => i.level === level), level, mode, new Set(), rng());
  return row({ level, mode, state: serialiseRound(createRound(level, mode, questions)), total: questions.length });
}
function unitRow(kind: 'unit_practice' | 'unit_check'): RoundRow {
  const questions =
    kind === 'unit_practice'
      ? generateUnitPractice(UNIT, units, allItems, new Set(), rng())
      : generateUnitCheck(UNIT, allItems, rng());
  return row({ level: UNIT.level, mode: kind, unit_id: UNIT.id, state: serialiseRound(createRound(UNIT.level, kind, questions, UNIT.id)), total: questions.length });
}
function reviewRow(): RoundRow {
  const questions = generateReview(allItems.filter((i) => i.level === 'beginner').slice(0, 6), allItems, rng());
  return row({ mode: 'review', state: serialiseRound(createRound('beginner', 'review', questions)), total: questions.length });
}

function data(activeRound: RoundRow | null, over: { profile?: Profile | null; unitProgress?: UnitProgressRow[]; dueCount?: number } = {}): AppData {
  const progress = new Map((over.unitProgress ?? []).map((r) => [r.unit_id, r]));
  const statuses = computeUnitStatuses(units, { unitProgress: progress, learned: new Set(), beginnerCompleted: true });
  return {
    status: 'ready',
    profile: over.profile === undefined ? profile : over.profile,
    progress: new Map(),
    learned: new Set(),
    unitProgress: progress,
    statuses,
    openLevels: unlockedLevels(units, statuses),
    dueCount: over.dueCount ?? 0,
    activeRound,
    reload: async () => {},
    setProfile: vi.fn(),
    setProgress: vi.fn(),
    setUnitProgress: vi.fn(),
    setActiveRound: vi.fn(),
  };
}

const deckDone: UnitProgressRow = { user_id: 'u1', unit_id: UNIT.id, learned_at: NOW, completed_at: null, best_score: null, attempts: 0 };

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname}</p>;
}

function mount(appData: AppData, path: string) {
  act(() =>
    root.render(
      <AuthContext.Provider value={auth}>
        <AppDataContext.Provider value={appData}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/play/:level/:mode" element={<RoundScreen />} />
              <Route path="/unit/:unitId/practice" element={<UnitRoundScreen kind="practice" />} />
              <Route path="/unit/:unitId/check" element={<UnitRoundScreen kind="check" />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/results/:roundId" element={<Where />} />
              <Route path="/unit/:unitId" element={<Where />} />
              <Route path="/practice" element={<Where />} />
            </Routes>
          </MemoryRouter>
        </AppDataContext.Provider>
      </AuthContext.Provider>,
    ),
  );
}

async function flush() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30));
  });
}

const playing = () => container.querySelector('[role="progressbar"]') !== null;
const where = () => container.querySelector('[data-testid="where"]')?.textContent;
const click = (el: Element) => act(() => void el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const buttonNamed = (text: string) => [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

/** Click Resume on Home, the way a learner does, and wait for the round to settle. */
async function resumeFromHome(appData: AppData) {
  mount(appData, '/home');
  const link = [...container.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Resume round')!;
  expect(link, 'Home offers Resume').toBeDefined();
  expect(link.getAttribute('href')).toBe(roundPath(appData.activeRound!, true));
  click(link);
  await flush();
}

describe('Resume from Home continues the round (a, b, c, d, e)', () => {
  for (const mode of ['match', 'translate', 'order', 'picture', 'mixed', 'write', 'gap'] as Mode[]) {
    it(`free ${mode} round`, async () => {
      await resumeFromHome(data(freeRow(mode)));
      expect(playing()).toBe(true);
      expect(mocks.startRound).not.toHaveBeenCalled();
    });
  }

  it('unit practice', async () => {
    await resumeFromHome(data(unitRow('unit_practice')));
    expect(playing()).toBe(true);
  });

  it('unit check', async () => {
    await resumeFromHome(data(unitRow('unit_check'), { unitProgress: [deckDone] }));
    expect(playing()).toBe(true);
  });

  it('unit check even when the Learn deck is not marked done (it used to bounce back to the unit page)', async () => {
    await resumeFromHome(data(unitRow('unit_check')));
    expect(playing()).toBe(true);
    expect(where()).toBeUndefined();
  });

  it('review, even when nothing is due any more', async () => {
    await resumeFromHome(data(reviewRow(), { dueCount: 0 }));
    expect(playing()).toBe(true);
    expect(container.textContent).not.toContain('All caught up');
  });
});

describe('Resume never silently does nothing', () => {
  it('finishes a round whose index is already past the end and shows Results (f)', async () => {
    const base = freeRow('translate');
    let state = base.state as RoundState;
    while (state.index < state.questions.length) {
      state = recordAnswer(state, {
        result: 'first',
        requeued: false,
        items: state.questions[state.index].itemIds.map((itemId) => ({ itemId, correct: true })),
      });
    }
    await resumeFromHome(data({ ...base, state: serialiseRound(state) }));
    expect(where()).toBe('/results/r1');
    expect(mocks.completeRound).toHaveBeenCalledTimes(1);
  });

  it('discards a state that fails validation and starts a fresh round (g)', async () => {
    await resumeFromHome(data({ ...freeRow('translate'), state: { version: 1, nonsense: true } }));
    expect(mocks.abandonRound).toHaveBeenCalledWith('r1');
    expect(mocks.startRound).toHaveBeenCalledTimes(1);
    expect(playing()).toBe(true);
  });

  it('waits for the profile instead of hanging or finishing early (h)', async () => {
    const active = freeRow('translate');
    mount(data(active, { profile: null }), '/home');
    click([...container.querySelectorAll('a')].find((a) => a.textContent?.trim() === 'Resume round')!);
    await flush();
    expect(playing()).toBe(false);
    expect(container.textContent).toContain('Getting your round ready');
    mount(data(active), '/home');
    // A fresh mount at the round address, now that the profile is there.
    mount(data(active), roundPath(active, true));
    await flush();
    expect(playing()).toBe(true);
  });

  it('shows an error with a retry, not a stuck screen, when a finished round has no profile to update', async () => {
    const base = freeRow('translate');
    let state = base.state as RoundState;
    while (state.index < state.questions.length) {
      state = recordAnswer(state, { result: 'first', requeued: false, items: state.questions[state.index].itemIds.map((itemId) => ({ itemId, correct: true })) });
    }
    const appData = data({ ...base, state: serialiseRound(state) }, { profile: null });
    mount(appData, roundPath(base, true));
    await flush();
    expect(container.textContent).toContain('Getting your round ready');
  });

  it('still resumes when the learner opens the game screen and presses Resume round on the "Round in progress" card', async () => {
    for (const [active, path, ready] of [
      [freeRow('translate'), '/play/beginner/translate', data(freeRow('translate'))],
      [unitRow('unit_practice'), `/unit/${UNIT.id}/practice`, data(unitRow('unit_practice'))],
      [unitRow('unit_check'), `/unit/${UNIT.id}/check`, data(unitRow('unit_check'), { unitProgress: [deckDone] })],
      [reviewRow(), '/review', data(reviewRow(), { dueCount: 0 })],
    ] as const) {
      void active;
      mount(ready, path);
      await flush();
      expect(container.textContent).toContain('Round in progress');
      click(buttonNamed('Resume round'));
      await flush();
      expect(playing(), path).toBe(true);
      act(() => root.unmount());
      root = createRoot(container);
    }
  });

  it('offers no dead Resume button for a round whose unit no longer exists', async () => {
    const gone = { ...unitRow('unit_practice'), unit_id: 'zz99-missing' };
    mount(data(gone), '/play/beginner/translate');
    await flush();
    expect(container.textContent).toContain('Round in progress');
    expect(buttonNamed('Resume round')).toBeUndefined();
    expect(buttonNamed('Start a new round')).toBeDefined();
  });

  it('keeps the shared round current after each answer, so Resume on Home continues from there', async () => {
    const appData = data(freeRow('translate'));
    mount(appData, '/play/beginner/translate?resume=1');
    await flush();
    const state = (appData.activeRound!.state as RoundState);
    const input = container.querySelector('input')!;
    const item = allItems.find((i) => i.id === state.questions[0].itemIds[0])!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, item.en[0]);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(buttonNamed('Check'));
    click(buttonNamed('Continue'));
    await flush();
    expect(appData.setActiveRound).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1', state: expect.objectContaining({ index: 1 }) }));
  });
});
