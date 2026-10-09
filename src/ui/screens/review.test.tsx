// @vitest-environment jsdom
import type { User } from '@supabase/supabase-js';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { units } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import type { ItemProgressRow } from '../../data/progressRepo';
import type { RoundRow } from '../../data/roundRepo';
import { addDays, NEW_SRS } from '../../game/srs';
import { toLocalDateString } from '../../game/streak';
import { createRound, serialiseRound } from '../../game/roundState';
import { computeUnitStatuses, unlockedLevels } from '../../game/unitUnlock';
import { Home } from './Home';
import { ReviewScreen } from './RoundScreen';

const mocks = vi.hoisted(() => ({
  completeRound: vi.fn(async () => {}),
  recordAttempts: vi.fn(async () => {}),
  updateProfile: vi.fn(async () => {}),
}));

vi.mock('../../data/roundRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/roundRepo')>()),
  completeRound: mocks.completeRound,
  saveRoundState: vi.fn(async () => {}),
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
const today = toLocalDateString(new Date());

const learnedRow = (itemId: string, due: string | null): ItemProgressRow => ({
  user_id: 'u1',
  item_id: itemId,
  attempt_count: 3,
  correct_count: 3,
  first_correct_at: '2026-10-01T00:00:00Z',
  last_seen_at: '2026-10-01T00:00:00Z',
  ...NEW_SRS,
  due_on: due,
});

function data(over: Partial<AppData> = {}): AppData {
  const statuses = computeUnitStatuses(units, { unitProgress: new Map(), learned: new Set(), beginnerCompleted: true });
  return {
    status: 'ready',
    profile: {
      id: 'u1',
      display_name: 'Aroha',
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      beginner_completed_at: '2026-10-01T00:00:00Z',
      created_at: '',
      updated_at: '',
    },
    progress: new Map(),
    learned: new Set(),
    unitProgress: new Map(),
    statuses,
    openLevels: unlockedLevels(units, statuses),
    dueCount: 0,
    activeRound: null,
    reload: async () => {},
    setProfile: vi.fn(),
    setProgress: vi.fn(),
    setUnitProgress: vi.fn(),
    setActiveRound: vi.fn(),
    ...over,
  };
}

function renderAt(path: string, appData: AppData) {
  act(() =>
    root.render(
      <AuthContext.Provider value={auth}>
        <AppDataContext.Provider value={appData}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/review" element={<ReviewScreen />} />
              <Route path="/results/:roundId" element={<p>results</p>} />
            </Routes>
          </MemoryRouter>
        </AppDataContext.Provider>
      </AuthContext.Provider>,
    ),
  );
}

const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

describe('Review on the Path', () => {
  it('shows "Review (N due)" with a link when items are due (FR7.2)', () => {
    renderAt('/home', data({ dueCount: 3 }));
    expect(container.textContent).toContain('Review (3 due)');
    expect(container.querySelector('a[href="/review"]')).not.toBeNull();
  });

  it('hides it when nothing is due', () => {
    renderAt('/home', data({ dueCount: 0 }));
    expect(container.textContent).not.toContain('Review (');
  });
});

describe('Review screen', () => {
  it('says all caught up when nothing is due', () => {
    renderAt('/review', data({ dueCount: 0 }));
    expect(container.textContent).toContain('All caught up');
  });

  it('updates ease, interval and due date when a review round ends (AC9)', async () => {
    const state = createRound(
      'beginner',
      'review',
      [{ mode: 'translate', itemIds: ['w-b-001'], requeued: false }],
    );
    const row: RoundRow = {
      id: 'rev-1',
      user_id: 'u1',
      level: 'beginner',
      mode: 'review',
      unit_id: null,
      status: 'in_progress',
      state: serialiseRound(state),
      score: null,
      total: 1,
      xp_earned: 0,
      started_at: '',
      completed_at: null,
    };
    const appData = data({
      dueCount: 1,
      activeRound: row,
      progress: new Map([['w-b-001', learnedRow('w-b-001', addDays(today, -2))]]),
    });
    renderAt('/review?resume=1', appData);
    await flush();
    expect(container.textContent).toContain('Review');

    const input = container.querySelector('input')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'dog');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const press = (text: string) =>
      act(() => {
        [...container.querySelectorAll('button')]
          .find((b) => b.textContent?.trim() === text)!
          .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
    press('Check');
    press('Continue');
    await flush();

    expect(mocks.recordAttempts).toHaveBeenCalledTimes(1);
    const saved = (mocks.recordAttempts.mock.calls[0] as unknown as [ItemProgressRow[]])[0][0];
    expect(saved).toMatchObject({ item_id: 'w-b-001', ease: 2.6, interval_days: 3, due_on: addDays(today, 3) });
    expect(mocks.completeRound).toHaveBeenCalledWith(expect.objectContaining({ id: 'rev-1', score: 1 }));
  });
});
