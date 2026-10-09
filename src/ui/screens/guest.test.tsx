// @vitest-environment jsdom
import type { User } from '@supabase/supabase-js';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { units } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import type { RoundRow } from '../../data/roundRepo';
import type { UnitProgressRow } from '../../data/unitProgressRepo';
import { computeUnitStatuses, unlockedLevels } from '../../game/unitUnlock';
import { Account } from './Account';
import { Home } from './Home';
import { Landing } from './Landing';
import { Results } from './Results';

vi.mock('../../data/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: null }));

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

const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

const buttonNamed = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement | undefined;

function authValue(over: Partial<AuthState> = {}): AuthState {
  return { user: { id: 'g1', email: undefined, is_anonymous: true } as User, isGuest: true, ...over } as AuthState;
}

function appData(unitProgress: UnitProgressRow[] = []): AppData {
  const progress = new Map(unitProgress.map((r) => [r.unit_id, r]));
  const learned = new Set<string>();
  const statuses = computeUnitStatuses(units, { unitProgress: progress, learned, beginnerCompleted: false });
  return {
    status: 'ready',
    profile: null,
    progress: new Map(),
    learned,
    unitProgress: progress,
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

function renderWith(auth: AuthState, ui: React.ReactElement, data: AppData = appData(), path = '/') {
  act(() =>
    root.render(
      <AuthContext.Provider value={auth}>
        <AppDataContext.Provider value={data}>
          <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
        </AppDataContext.Provider>
      </AuthContext.Provider>,
    ),
  );
}

describe('Landing guest button', () => {
  it('calls continueAsGuest', () => {
    const continueAsGuest = vi.fn().mockResolvedValue(undefined);
    renderWith({ session: null, loading: false, continueAsGuest } as unknown as AuthState, <Landing />);
    const button = buttonNamed('Try it first, no account needed');
    expect(button).toBeDefined();
    click(button!);
    expect(continueAsGuest).toHaveBeenCalledTimes(1);
  });
});

describe('Home as a guest', () => {
  const doneDeck: UnitProgressRow = { unit_id: units[0].id, user_id: 'g1', learned_at: '2026-10-01T00:00:00Z', completed_at: null, best_score: null, attempts: 0 };

  it('greets with just Kia ora and hides the save card for a brand-new guest', () => {
    renderWith(authValue(), <Home />);
    expect(container.querySelector('h1')?.textContent).toBe('Kia ora');
    expect(container.textContent).not.toContain('Save your progress');
  });

  it('shows the save card once a unit Learn step is finished', () => {
    renderWith(authValue(), <Home />, appData([doneDeck]));
    expect(container.querySelector('h1')?.textContent).toBe('Kia ora');
    expect(container.textContent).toContain("You're trying Ako as a guest. Save your progress so you don't lose it.");
    expect(container.querySelector('a[href="/account"]')?.textContent).toBe('Save your progress');
  });

  it('shows the save card once a round has been played', () => {
    renderWith(authValue(), <Home />, appData([{ ...doneDeck, learned_at: null, attempts: 1 }]));
    expect(container.textContent).toContain('Save your progress');
  });

  it('never shows the save card to a signed-in user', () => {
    renderWith(authValue({ isGuest: false, user: { id: 'u1', email: 'a@b.c' } as User }), <Home />, appData([doneDeck]));
    expect(container.textContent).not.toContain('Save your progress');
  });
});

describe('Results nudge', () => {
  function round(passed: boolean): RoundRow {
    return {
      id: 'r1',
      user_id: 'g1',
      level: 'beginner',
      mode: 'unit_check',
      unit_id: units[0].id,
      status: 'completed',
      state: { summary: { newlyLearned: 0, streak: 1, unitCheck: { passed, firstCompletion: true } } },
      score: 11,
      total: 12,
      xp_earned: 10,
      started_at: '',
      completed_at: '',
    } as RoundRow;
  }

  function renderResults(auth: AuthState, r: RoundRow) {
    act(() =>
      root.render(
        <AuthContext.Provider value={auth}>
          <AppDataContext.Provider value={appData()}>
            <MemoryRouter initialEntries={[{ pathname: '/results/r1', state: { round: r } }]}>
              <Routes>
                <Route path="/results/:roundId" element={<Results />} />
              </Routes>
            </MemoryRouter>
          </AppDataContext.Provider>
        </AuthContext.Provider>,
      ),
    );
  }

  it('nudges a guest after a passed Kiwiz', () => {
    renderResults(authValue(), round(true));
    expect(container.textContent).toContain("You're a guest. Save your progress so you don't lose it.");
  });

  it('does not nudge after a failed Kiwiz or for a signed-in user', () => {
    renderResults(authValue(), round(false));
    expect(container.textContent).not.toContain("You're a guest");
    renderResults(authValue({ isGuest: false }), round(true));
    expect(container.textContent).not.toContain("You're a guest");
  });
});

describe('Account as a guest', () => {
  function renderAccount(auth: AuthState) {
    renderWith(
      auth,
      <Routes>
        <Route path="/" element={<Account />} />
      </Routes>,
    );
  }

  it('offers to save instead of showing account details', () => {
    renderAccount(authValue());
    expect(container.textContent).toContain('Save your progress');
    expect(container.textContent).not.toContain('Signed in as');
    expect(container.textContent).not.toContain('Delete my account and data');
    expect(buttonNamed('Save with Google')).toBeDefined();
    expect(buttonNamed('Save with email')).toBeDefined();
    expect(buttonNamed('Start over')).toBeDefined();
  });

  it('asks before signing a guest out', () => {
    const signOut = vi.fn().mockResolvedValue(undefined);
    renderAccount(authValue({ signOut }));
    click(buttonNamed('Sign out')!);
    expect(signOut).not.toHaveBeenCalled();
    expect(container.textContent).toContain('Your progress will be lost unless you save it first.');
    click(buttonNamed('Sign out anyway')!);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('can back out of signing out', () => {
    const signOut = vi.fn();
    renderAccount(authValue({ signOut }));
    click(buttonNamed('Sign out')!);
    click(buttonNamed('Cancel')!);
    expect(signOut).not.toHaveBeenCalled();
    expect(buttonNamed('Sign out')).toBeDefined();
  });

  it('still shows the normal account for a signed-in user', () => {
    renderAccount(authValue({ isGuest: false, user: { id: 'u1', email: 'a@b.c' } as User }));
    expect(container.textContent).toContain('Signed in as a@b.c.');
    expect(container.textContent).not.toContain('Save your progress');
  });

  it('explains when the Google account already has Ako progress, and confirms before switching', () => {
    const switchToGoogleAccount = vi.fn().mockResolvedValue(undefined);
    renderAccount(authValue({ googleLinkConflict: true, switchToGoogleAccount, dismissGoogleLinkConflict: vi.fn() }));
    expect(container.textContent).toContain(
      'That Google account already has Ako progress. Signing into it will leave this guest progress behind.',
    );
    click(buttonNamed('Sign in to that account')!);
    expect(switchToGoogleAccount).not.toHaveBeenCalled();
    click(buttonNamed('Yes, sign in')!);
    expect(switchToGoogleAccount).toHaveBeenCalledTimes(1);
  });

  it('shows no conflict message by default', () => {
    renderAccount(authValue({ googleLinkConflict: false }));
    expect(container.textContent).not.toContain('already has Ako progress');
  });
});
