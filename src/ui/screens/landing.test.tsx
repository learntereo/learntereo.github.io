// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { unitsForLevel } from '../../content/content';
import { LEVELS } from '../../game/types';
import { LEVEL_LABEL } from '../labels';
import { Landing } from './Landing';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../data/supabaseClient', () => ({ isSupabaseConfigured: true, supabase: null }));

let container: HTMLDivElement;
let root: Root;

const continueAsGuest = vi.fn().mockResolvedValue(undefined);

beforeEach(() => {
  continueAsGuest.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <AuthContext.Provider value={{ session: null, loading: false, continueAsGuest } as unknown as AuthState}>
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      </AuthContext.Provider>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const buttonNamed = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement | undefined;
const click = (el: Element) =>
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

describe('Landing hero', () => {
  it('has the h1 with Māori marked up', () => {
    expect(container.querySelector('h1')?.textContent).toBe('Learn te reo Māori');
    expect(container.querySelector('h1 [lang="mi"]')?.textContent).toBe('Māori');
  });

  it('Start learning calls continueAsGuest', () => {
    click(buttonNamed('Start learning')!);
    expect(continueAsGuest).toHaveBeenCalledTimes(1);
    expect(buttonNamed('Try it first, no account needed')).toBeUndefined();
  });

  it('hides the sign-in card until asked, and toggles it', () => {
    const toggle = buttonNamed('I already have an account')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#signin-card')).toBeNull();
    click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-controls')).toBe('signin-card');
    const card = container.querySelector('#signin-card')!;
    expect(card).not.toBeNull();
    expect(document.activeElement).toBe(card);
    expect(buttonNamed('Continue with Google')).toBeDefined();
    click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('#signin-card')).toBeNull();
  });
});

describe('Landing course content', () => {
  it('shows a card per level with a unit count and three example topics', () => {
    const cards = [...container.querySelectorAll('[data-testid="level-card"]')];
    expect(cards).toHaveLength(LEVELS.length);
    LEVELS.forEach((level, i) => {
      const expected = unitsForLevel(level);
      expect(cards[i].querySelector('h3')?.textContent).toBe(LEVEL_LABEL[level]);
      expect(cards[i].textContent).toContain(`${expected.length} units`);
      const topics = [...cards[i].querySelectorAll('li')].map((li) => li.textContent);
      expect(topics).toEqual(expected.slice(0, 3).map((u) => u.title));
    });
  });

  it('lists every unit under See all units, with the Māori title marked', () => {
    const details = container.querySelector('details')!;
    const total = LEVELS.reduce((n, l) => n + unitsForLevel(l).length, 0);
    expect(details.querySelector('summary')?.textContent).toBe(`See all ${total} units`);
    const items = [...details.querySelectorAll('li')];
    expect(items).toHaveLength(total);
    for (const level of LEVELS) {
      for (const u of unitsForLevel(level)) {
        const li = items.find((i) => i.textContent === `${u.title} ${u.titleMi}`);
        expect(li).toBeDefined();
        expect(li!.querySelector('[lang="mi"]')?.textContent).toBe(u.titleMi);
      }
    }
  });
});

describe('Landing pepeha card', () => {
  it('links to the pepeha builder', () => {
    const link = [...container.querySelectorAll('a')].find((a) => a.textContent === 'Open the pepeha builder')!;
    expect(link.getAttribute('href')).toBe(`${import.meta.env.BASE_URL}pepeha/`);
    expect(container.textContent).toContain('Introduce yourself in te reo Māori. No sign-in needed.');
  });
});
