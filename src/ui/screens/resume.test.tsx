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

const toasts = vi.hoisted(() => [] as string[]);
vi.mock('../../lib/toastBus', () => ({ showToast: (text: string) => void toasts.push(text) }));

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
  toasts.length = 0;
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
      ? generateUnitPractice(UNIT, allItems, new Set(), rng())
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

/** Open the round's own resume address and wait for the round to settle. */
async function resumeFromHome(appData: AppData) {
  mount(appData, roundPath(appData.activeRound!, true));
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
    mount(data(active, { profile: null }), roundPath(active, true));
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

  it('closes a stale round whose unit no longer exists and starts the screen the learner opened', async () => {
    const gone = { ...unitRow('unit_practice'), unit_id: 'zz99-missing' };
    mount(data(gone), '/play/beginner/translate');
    await flush();
    expect(mocks.abandonRound).toHaveBeenCalledWith('r1');
    expect(playing()).toBe(true);
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

describe('Starting a round on purpose always starts that round', () => {
  const b03 = 'b03-tatau';
  const headerOf = () => container.querySelector('main')?.textContent ?? '';

  it('closes an unfinished round of another unit and starts a fresh one, with a toast', async () => {
    const other = { ...unitRow('unit_practice'), unit_id: 'b05-kararehe' };
    mount(data(other), `/unit/${b03}/practice`);
    await flush();
    expect(mocks.abandonRound).toHaveBeenCalledWith('r1');
    expect(mocks.startRound).toHaveBeenCalledTimes(1);
    expect(mocks.startRound.mock.calls[0][4]).toBe(b03);
    expect(toasts).toEqual(['Your unfinished Animals unit practice round was closed.']);
    expect(playing()).toBe(true);
    expect(headerOf()).toContain('Numbers 1 to 10 · Unit practice');
    expect(headerOf()).not.toContain('Animals');
  });

  it('closes an unfinished free round when a unit practice is started', async () => {
    mount(data(freeRow('write')), `/unit/${b03}/practice`);
    await flush();
    expect(toasts).toEqual(['Your unfinished Beginner Write round was closed.']);
    expect(mocks.startRound.mock.calls[0][2]).toBe('unit_practice');
    expect(headerOf()).toContain('Numbers 1 to 10 · Unit practice');
  });

  it('closes another round when the Kiwiz, a free round or a review is started', async () => {
    const cases: [string, ReturnType<typeof data>][] = [
      [`/unit/${b03}/check`, data(freeRow('mixed'), { unitProgress: [{ ...deckDone, unit_id: b03 }] })],
      ['/play/beginner/gap', data(unitRow('unit_practice'))],
      ['/review', data(freeRow('order'), { dueCount: 3 })],
    ];
    for (const [path, appData] of cases) {
      mocks.startRound.mockClear();
      mocks.abandonRound.mockClear();
      toasts.length = 0;
      mount(appData, path);
      await flush();
      expect(mocks.abandonRound, path).toHaveBeenCalledWith('r1');
      expect(toasts.length, path).toBe(1);
      if (path !== '/review') expect(mocks.startRound, path).toHaveBeenCalledTimes(1);
      act(() => root.unmount());
      root = createRoot(container);
    }
  });

  it('never closes anything when nothing else is in progress', async () => {
    mount(data(null), `/unit/${b03}/practice`);
    await flush();
    expect(mocks.abandonRound).not.toHaveBeenCalled();
    expect(toasts).toEqual([]);
    expect(mocks.startRound).toHaveBeenCalledTimes(1);
  });

  it('asks before replacing the very same round, and Start a new round closes it', async () => {
    const same = unitRow('unit_practice');
    mount(data({ ...same, unit_id: UNIT.id }), `/unit/${UNIT.id}/practice`);
    await flush();
    expect(container.textContent).toContain('Round in progress');
    click(buttonNamed('Start a new round'));
    await flush();
    expect(mocks.abandonRound).toHaveBeenCalledWith('r1');
    expect(playing()).toBe(true);
  });

  it('sends a resume link for a different round to the own screen of that round', async () => {
    const b05 = unitsById.get('b05-kararehe')!;
    const questions = generateUnitPractice(b05, allItems, new Set(), rng());
    const other = row({
      level: 'beginner',
      mode: 'unit_practice',
      unit_id: b05.id,
      state: serialiseRound(createRound('beginner', 'unit_practice', questions, b05.id)),
      total: questions.length,
    });
    mount(data(other), `/unit/${b03}/practice?resume=1`);
    await flush();
    // The round moves to its own route and plays under its own header. Nothing is closed.
    expect(mocks.abandonRound).not.toHaveBeenCalled();
    expect(mocks.startRound).not.toHaveBeenCalled();
    expect(toasts).toEqual([]);
    expect(playing()).toBe(true);
    expect(container.querySelector('main')?.textContent).toContain('Animals · Unit practice');
  });

  it('refuses to show a stored round under the wrong unit even when its row says otherwise', async () => {
    const row = unitRow('unit_practice'); // state is for i01-mahi
    mount(data({ ...row, unit_id: UNIT.id, state: { ...(row.state as RoundState), unitId: 'b05-kararehe' } }), `/unit/${UNIT.id}/practice?resume=1`);
    await flush();
    expect(headerOf()).not.toContain('Animals');
  });
});

describe('Resuming from Home lands on the right route', () => {
  it('opens a unit practice round on its own unit, with that unit in the header', async () => {
    await resumeFromHome(data(unitRow('unit_practice')));
    expect(container.querySelector('main')?.textContent).toContain('Everyday actions · Unit practice');
  });

  it('opens a free round on its own level and game', async () => {
    await resumeFromHome(data(freeRow('write')));
    expect(container.querySelector('main')?.textContent).toContain('Beginner · Write');
  });
});
