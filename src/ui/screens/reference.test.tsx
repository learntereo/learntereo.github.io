// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { units } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import { computeUnitStatuses } from '../../game/unitUnlock';
import { Glossary } from './Glossary';
import { Grammar } from './Grammar';
import { Pronunciation } from './Pronunciation';
import { Progress } from './Progress';

vi.mock('../../data/roundRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/roundRepo')>()),
  getHistory: vi.fn(async () => []),
}));

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

function data(opts: { beginnerCompleted?: boolean; learned?: string[]; dueCount?: number } = {}): AppData {
  const learned = new Set(opts.learned ?? []);
  const statuses = computeUnitStatuses(units, {
    unitProgress: new Map(),
    learned,
    beginnerCompleted: opts.beginnerCompleted ?? false,
  });
  return {
    status: 'ready',
    profile: {
      id: 'u1',
      display_name: 'Aroha',
      xp: 120,
      current_streak: 2,
      longest_streak: 4,
      last_active_date: null,
      beginner_completed_at: null,
      created_at: '',
      updated_at: '',
    },
    progress: new Map(),
    learned,
    unitProgress: new Map(),
    statuses,
    openLevels: ['beginner'],
    dueCount: opts.dueCount ?? 0,
    activeRound: null,
    reload: async () => {},
    setProfile: () => {},
    setProgress: () => {},
    setUnitProgress: () => {},
    setActiveRound: () => {},
  };
}

function show(node: React.ReactNode, appData: AppData) {
  act(() =>
    root.render(
      <AppDataContext.Provider value={appData}>
        <MemoryRouter>{node}</MemoryRouter>
      </AppDataContext.Provider>,
    ),
  );
}

function search(value: string) {
  const input = container.querySelector('input')!;
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

describe('Glossary (AC11)', () => {
  it('lists only words from opened units', () => {
    show(<Glossary />, data({ beginnerCompleted: true }));
    expect(container.textContent).toContain('kia ora');
    expect(container.textContent).toContain('haere'); // Intermediate unit 1 is open
    expect(container.textContent).not.toContain('Monday'); // Intermediate unit 2 is still closed
  });

  it('searches without macrons', () => {
    show(<Glossary />, data({ beginnerCompleted: true }));
    search('kuri');
    const entry = [...container.querySelectorAll('li')].find((li) => li.textContent?.includes('kurī'));
    expect(entry).toBeDefined();
    expect(entry?.textContent).toContain('dog');
    expect(container.textContent).toContain('1 word found');
  });

  it('shows a tick for learned words and hides words from locked units', () => {
    show(<Glossary />, data({ learned: ['w-b-057'] }));
    const hello = [...container.querySelectorAll('li')].find((li) => li.textContent?.includes('kia ora'));
    expect(hello?.textContent).toContain('Learned');
    search('kuri');
    expect(container.textContent).toContain('0 words found');
  });
});

describe('Grammar index', () => {
  it('shows notes for opened units only', () => {
    show(<Grammar />, data());
    expect(container.querySelectorAll('details')).toHaveLength(1);
    expect(container.textContent).toContain('Hello to one, two or many');
    expect(container.textContent).toContain('1 of 22 so far');
  });

  it('shows every Beginner note and the first Intermediate note after Beginner', () => {
    show(<Grammar />, data({ beginnerCompleted: true }));
    expect(container.querySelectorAll('details')).toHaveLength(9);
  });
});

describe('Pronunciation (AC10)', () => {
  it('covers vowels, macrons, wh, ng and examples', () => {
    show(<Pronunciation />, data());
    const text = container.textContent ?? '';
    for (const letter of ['ā', 'ē', 'ī', 'ō', 'ū']) expect(text).toContain(letter);
    expect(text).toContain('macron');
    expect(text).toContain('wh');
    expect(text).toContain('ng');
    expect(text).toContain('whānau');
    expect(text).toContain('ngeru');
  });
});

describe('Progress stats (FR10)', () => {
  it('shows units and items per level and the due count', async () => {
    show(<Progress />, data({ learned: ['w-b-057', 'w-b-059'], dueCount: 4 }));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    const text = container.textContent ?? '';
    expect(text).toContain('Due for review');
    expect(text).toContain('0 / 8 units complete');
    expect(text).toContain('2 / ');
    expect(text).toContain('Beginner');
    expect(text).toContain('Intermediate');
    expect(text).toContain('Advanced');
  });
});
