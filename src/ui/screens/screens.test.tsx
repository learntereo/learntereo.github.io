// @vitest-environment jsdom
import type { User } from '@supabase/supabase-js';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { units } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import type { UnitProgressRow } from '../../data/unitProgressRepo';
import { computeUnitStatuses, unlockedLevels } from '../../game/unitUnlock';
import { GrammarNote } from '../components/GrammarNote';
import { Home } from './Home';
import { LearnDeck } from './LearnDeck';
import { UnitScreen } from './UnitScreen';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const auth = { user: { id: 'u1', email: 'a@b.c' } as User } as AuthState;

function appData(opts: { unitProgress?: UnitProgressRow[]; beginnerCompleted?: boolean; learned?: string[] } = {}): AppData {
  const unitProgress = new Map((opts.unitProgress ?? []).map((r) => [r.unit_id, r]));
  const learned = new Set(opts.learned ?? []);
  const statuses = computeUnitStatuses(units, {
    unitProgress,
    learned,
    beginnerCompleted: opts.beginnerCompleted ?? false,
  });
  return {
    status: 'ready',
    profile: {
      id: 'u1',
      display_name: 'Aroha',
      xp: 0,
      current_streak: 0,
      longest_streak: 0,
      last_active_date: null,
      beginner_completed_at: opts.beginnerCompleted ? '2026-10-01T00:00:00Z' : null,
      created_at: '',
      updated_at: '',
    },
    progress: new Map(),
    learned,
    unitProgress,
    statuses,
    openLevels: unlockedLevels(units, statuses),
    dueCount: 0,
    activeRound: null,
    reload: async () => {},
    setProfile: () => {},
    setProgress: () => {},
    setUnitProgress: vi.fn(),
    setActiveRound: () => {},
  };
}

function renderAt(path: string, data: AppData) {
  act(() =>
    root.render(
      <AuthContext.Provider value={auth}>
        <AppDataContext.Provider value={data}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/home" element={<Home />} />
              <Route path="/unit/:unitId" element={<UnitScreen />} />
              <Route path="/unit/:unitId/learn" element={<LearnDeck />} />
            </Routes>
          </MemoryRouter>
        </AppDataContext.Provider>
      </AuthContext.Provider>,
    ),
  );
}

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

const buttonNamed = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

const doneRow = (unitId: string): UnitProgressRow => ({
  user_id: 'u1',
  unit_id: unitId,
  learned_at: '2026-10-01T00:00:00Z',
  completed_at: '2026-10-01T00:00:00Z',
  best_score: 11,
  attempts: 1,
});

describe('Path home (AC1)', () => {
  it('shows the first three units open and every other unit locked for a new learner', () => {
    renderAt('/home', appData());
    // The Next up card and the unit rows lead to the same three units.
    const open = new Set([...container.querySelectorAll('a[href^="/unit/"]')].map((a) => a.getAttribute('href')));
    expect([...open]).toEqual(['/unit/b01-greetings', '/unit/b02-whanau', '/unit/b03-tatau']);
    expect(container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(units.length - 3);
    expect(container.textContent).toContain('Advanced');
    expect(container.textContent).not.toContain('Coming soon');
  });

  it('offers Free practice and a Next up card', () => {
    renderAt('/home', appData());
    expect(container.querySelector('a[href="/practice"]')).not.toBeNull();
    expect(container.textContent).toContain('Next up');
  });

  it('opens the first three Intermediate units for a learner who finished Beginner in the PoC (AC5)', () => {
    renderAt('/home', appData({ beginnerCompleted: true }));
    const hrefs = [...container.querySelectorAll('a[href^="/unit/"]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/unit/i01-mahi');
    expect(hrefs).toContain('/unit/i03-wahi');
    expect(hrefs).toContain('/unit/b08-whare-kura');
    expect(hrefs).not.toContain('/unit/i04-kare-a-roto');
    expect(container.textContent).toContain('Complete');
  });

  it('opens the next unit after a pass (AC3)', () => {
    renderAt('/home', appData({ unitProgress: [doneRow('b01-greetings')] }));
    const hrefs = [...container.querySelectorAll('a[href^="/unit/"]')].map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/unit/b04-taiao');
    expect(hrefs).not.toContain('/unit/b05-kararehe');
  });
});

describe('Unit screen', () => {
  it('sends a locked unit back to the Path', () => {
    renderAt('/unit/b04-taiao', appData());
    expect(container.querySelector('h1')?.textContent).toContain('Aroha');
  });

  it('keeps the Kiwiz disabled until Learn is done', () => {
    renderAt('/unit/b01-greetings', appData());
    expect(buttonNamed('Take the Kiwiz').disabled).toBe(true);
    expect(container.textContent).toContain('Finish Learn first');
    expect(container.querySelector('a[href="/unit/b01-greetings/learn"]')).not.toBeNull();
    expect(container.querySelector('a[href="/unit/b01-greetings/practice"]')).not.toBeNull();
  });

  it('opens the check once Learn is done and shows the best score', () => {
    const row: UnitProgressRow = { ...doneRow('b01-greetings'), completed_at: null, best_score: 9 };
    renderAt('/unit/b01-greetings', appData({ unitProgress: [row] }));
    expect(container.querySelector('a[href="/unit/b01-greetings/check"]')).not.toBeNull();
    expect(container.textContent).toContain('Best Kiwiz 9 / 12');
  });

  it('shows the grammar note', () => {
    renderAt('/unit/b01-greetings', appData());
    expect(container.querySelector('details')?.textContent).toContain('Tēnā koe');
  });
});

describe('Learn deck (AC2)', () => {
  it('shows a word card with meaning, then the grammar note, then a finish card that marks Learn done', () => {
    const data = appData();
    renderAt('/unit/b01-greetings/learn', data);
    expect(container.querySelector('[lang="mi"]')?.textContent).toBe('kia ora');
    expect(container.textContent).toContain('hello');
    expect(container.textContent).toContain('Word 1 of 12');

    for (let i = 0; i < 11; i++) click(buttonNamed('Next'));
    expect(container.textContent).toContain('Word 12 of 12');
    click(buttonNamed('Next'));
    expect(container.textContent).toContain('Grammar note');
    expect(container.textContent).toContain('Hello to one, two or many');
    expect(data.setUnitProgress).not.toHaveBeenCalled();

    click(buttonNamed('Next'));
    expect(container.textContent).toContain('Kua oti!');
    expect(container.querySelector('a[href="/unit/b01-greetings/practice"]')).not.toBeNull();
    expect(data.setUnitProgress).toHaveBeenCalledTimes(1);
    expect(vi.mocked(data.setUnitProgress).mock.calls[0][0]).toMatchObject({ unit_id: 'b01-greetings' });
    expect(buttonNamed('Next').disabled).toBe(true);
  });

  it('goes back and stops at the first card', () => {
    renderAt('/unit/b01-greetings/learn', appData());
    expect(buttonNamed('Back').disabled).toBe(true);
    click(buttonNamed('Next'));
    expect(container.textContent).toContain('Word 2 of 12');
    click(buttonNamed('Back'));
    expect(container.textContent).toContain('Word 1 of 12');
  });
});

describe('GrammarNote', () => {
  it('renders Markdown as elements and marks italics as Māori', () => {
    act(() => root.render(<GrammarNote markdown={'## Title\n\nSay *kia ora* to **everyone**.\n\n- one\n- two'} />));
    expect(container.querySelector('h4')?.textContent).toBe('Title');
    expect(container.querySelector('em')?.getAttribute('lang')).toBe('mi');
    expect(container.querySelector('strong')?.textContent).toBe('everyone');
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('never creates elements from raw HTML', () => {
    act(() =>
      root.render(<GrammarNote markdown={'<img src=x onerror=alert(1)> and <script>alert(1)</script>'} />),
    );
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toContain('<script>alert(1)</script>');
  });
});
