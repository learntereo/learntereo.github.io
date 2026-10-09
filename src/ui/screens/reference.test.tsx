// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { units } from '../../content/content';
import type { UnitProgressRow } from '../../data/unitProgressRepo';
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

function data(
  opts: {
    beginnerCompleted?: boolean;
    learned?: string[];
    dueCount?: number;
    unitProgress?: UnitProgressRow[];
  } = {},
): AppData {
  const learned = new Set(opts.learned ?? []);
  const unitProgress = new Map((opts.unitProgress ?? []).map((r) => [r.unit_id, r]));
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
    unitProgress,
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
    expect(container.textContent).toContain('Monday'); // so are Intermediate units 2 and 3
    expect(container.textContent).not.toContain('thirsty'); // Intermediate unit 4 is still closed
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
    expect(container.querySelectorAll('details')).toHaveLength(3);
    expect(container.textContent).toContain('Hello to one, two or many');
    expect(container.textContent).toContain('3 of 22');
  });

  it('shows every Beginner note and the first three Intermediate notes after Beginner', () => {
    show(<Grammar />, data({ beginnerCompleted: true }));
    expect(container.querySelectorAll('details')).toHaveLength(11);
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

describe('Progress: Your Kiwiana hero', () => {
  async function renderProgress(opts: Parameters<typeof data>[0] = {}) {
    show(<Progress />, data(opts));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }

  it('comes first, with the ring count, the rank and what the next rank needs', async () => {
    await renderProgress({ beginnerCompleted: true });
    const hero = container.querySelector('#your-kiwiana')!.closest('section')!;
    expect(container.querySelector('main')!.querySelector('section')).toBe(hero);
    expect(hero.textContent).toContain('8 / 20');
    expect(hero.textContent).toContain('Explorer');
    expect(hero.textContent).toContain('2 more treasures to become Collector');
    expect(hero.querySelector('a[href="/kiwiana"]')?.textContent).toBe('See all Kiwiana');
  });

  it('puts the stats and history below the hero', async () => {
    await renderProgress();
    const text = container.textContent ?? '';
    expect(text.indexOf('Your Kiwiana')).toBeLessThan(text.indexOf('Total Kiwi XP'));
    expect(text.indexOf('Total Kiwi XP')).toBeLessThan(text.indexOf('Recent rounds'));
  });

  it('shows a Ready to start rank and the next treasure progress for a new learner', async () => {
    await renderProgress();
    const hero = container.querySelector('#your-kiwiana')!.closest('section')!;
    expect(hero.textContent).toContain('Ready to start');
    expect(hero.textContent).toContain('1 more treasure to become Kiwiana rookie');
    expect(hero.textContent).toContain('Greetings and introductions: 0 of 19 items learned');
    expect(hero.querySelector('[role="progressbar"]')?.getAttribute('aria-valuemax')).toBe('19');
    expect(hero.textContent).not.toContain('Recently unlocked');
  });

  it('has a shelf of all 20: colour tiles open the story, locked tiles say nothing about the treasure', async () => {
    await renderProgress({ beginnerCompleted: true });
    const tiles = container.querySelectorAll('[aria-label="All 20 kiwiana"] li');
    expect(tiles).toHaveLength(20);
    expect(container.querySelectorAll('[aria-label="All 20 kiwiana"] svg[data-locked="true"]')).toHaveLength(12);
    const lockedText = [...tiles].slice(8).map((t) => t.textContent).join(' ');
    expect(lockedText).not.toMatch(/Tūī|Pūkeko|Kūmara|Golden/);
    const paua = container.querySelector('button[aria-label="Read about Pāua"]') as HTMLButtonElement;
    act(() => void paua.click());
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain('eyes of carved figures');
  });

  it('shows the Finish hint when a locked shelf tile is tapped, and opens nothing', async () => {
    await renderProgress();
    const locked = [...container.querySelectorAll('[aria-label="All 20 kiwiana"] button')][0] as HTMLButtonElement;
    act(() => void locked.click());
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Finish Greetings and introductions to unlock');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('lists the last three unlocked with dates where the unit has one', async () => {
    const done = (unit: string, at: string) => ({
      user_id: 'u1',
      unit_id: unit,
      learned_at: at,
      completed_at: at,
      best_score: 11,
      attempts: 1,
    });
    await renderProgress({
      unitProgress: [
        done('b01-greetings', '2026-10-01T10:00:00Z'),
        done('b02-whanau', '2026-10-02T10:00:00Z'),
        done('b03-tatau', '2026-10-03T10:00:00Z'),
        done('b04-taiao', '2026-10-04T10:00:00Z'),
      ],
    });
    const recent = container.querySelector('h3')!.parentElement!;
    expect(recent.textContent).toContain('Recently unlocked');
    const names = [...recent.querySelectorAll('li strong')].map((s) => s.textContent);
    expect(names).toEqual(['Pōhutukawa', 'Silver fern', 'Jandals']);
    expect(recent.textContent).toMatch(/2026/);
  });
});
