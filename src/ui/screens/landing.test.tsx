// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthContext, type AuthState } from '../../auth/AuthContext';
import { unitsForLevel } from '../../content/content';
import { LEVELS } from '../../game/types';
import { LEVEL_LABEL } from '../labels';
import { Landing } from './Landing';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <AuthContext.Provider value={{ session: null, loading: false } as AuthState}>
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

describe('Landing course content', () => {
  it('has a plain intro under an h2', () => {
    expect(container.querySelector('h2')?.textContent).toBe('Learn te reo Māori, free');
    expect(container.textContent).toContain('beginner to advanced');
  });

  it('lists every unit title from the content data under its level', () => {
    const headings = [...container.querySelectorAll('h3')].map((h) => h.textContent);
    expect(headings).toEqual(LEVELS.map((l) => LEVEL_LABEL[l]));
    for (const level of LEVELS) {
      const list = [...container.querySelectorAll('h3')].find((h) => h.textContent === LEVEL_LABEL[level])!.parentElement!.querySelector('ul')!;
      const expected = unitsForLevel(level);
      expect(list.querySelectorAll('li')).toHaveLength(expected.length);
      expected.forEach((u, i) => {
        const li = list.querySelectorAll('li')[i];
        expect(li.textContent).toContain(u.title);
        expect(li.querySelector('[lang="mi"]')?.textContent).toBe(u.titleMi);
      });
    }
  });

  it('marks te reo Māori text as Māori', () => {
    expect(container.querySelector('h2 [lang="mi"]')?.textContent).toBe('Māori');
  });
});
