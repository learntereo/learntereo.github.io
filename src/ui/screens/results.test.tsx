// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { units } from '../../content/content';
import { AppDataContext, type AppData } from '../../data/AppDataContext';
import type { RoundRow } from '../../data/roundRepo';
import type { RoundSummary } from '../../game/types';
import { computeUnitStatuses } from '../../game/unitUnlock';
import { roundPath } from '../paths';
import { Results } from './Results';

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

function round(over: Partial<RoundRow>, summary: Partial<RoundSummary>): RoundRow {
  return {
    id: 'r1',
    user_id: 'u1',
    level: 'beginner',
    mode: 'unit_check',
    unit_id: 'b01-greetings',
    status: 'completed',
    state: { summary: { newlyLearned: 2, streak: 3, ...summary } },
    score: 11,
    total: 12,
    xp_earned: 120,
    started_at: '',
    completed_at: '',
    ...over,
  };
}

function renderResults(r: RoundRow, completed: string[]) {
  const statuses = computeUnitStatuses(units, {
    unitProgress: new Map(
      completed.map((id) => [id, { unit_id: id, learned_at: 'x', completed_at: 'x', best_score: 11, attempts: 1 }]),
    ),
    learned: new Set(),
    beginnerCompleted: false,
  });
  const data = { statuses } as unknown as AppData;
  act(() =>
    root.render(
      <AppDataContext.Provider value={data}>
        <MemoryRouter initialEntries={[{ pathname: '/results/r1', state: { round: r } }]}>
          <Routes>
            <Route path="/results/:roundId" element={<Results />} />
          </Routes>
        </MemoryRouter>
      </AppDataContext.Provider>,
    ),
  );
}

const hrefs = () => [...container.querySelectorAll('a')].map((a) => a.getAttribute('href'));

describe('Results for a unit check', () => {
  it('celebrates a pass, announces the unlocked unit and links to it (AC3)', () => {
    renderResults(
      round({}, {
        unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true, nextUnitId: 'b02-whanau' },
        missedItemIds: ['w-b-057'],
      }),
      ['b01-greetings'],
    );
    expect(container.textContent).toContain('Unit complete');
    expect(container.textContent).toContain('11 / 12');
    expect(container.textContent).toContain('The next unit is open');
    expect(hrefs()).toContain('/unit/b02-whanau');
    expect(container.textContent).toContain('Words to revisit (1)');
  });

  it('lists the missed words and offers another go after a fail (AC4)', () => {
    renderResults(
      round({ score: 9 }, {
        unitCheck: { unitId: 'b01-greetings', passed: false, firstCompletion: false },
        missedItemIds: ['w-b-057', 'w-b-059', 's-b-001'],
      }),
      [],
    );
    expect(container.textContent).not.toContain('Unit complete');
    expect(container.textContent).toContain('Not this time');
    expect(container.textContent).toContain('You need 10 out of 12');
    expect(container.textContent).toContain('Words to revisit (3)');
    expect(container.textContent).toContain('kia ora');
    expect(hrefs()).toContain('/unit/b01-greetings/practice');
    expect(hrefs()).toContain('/unit/b01-greetings/check');
    expect(hrefs()).not.toContain('/unit/b02-whanau');
  });
});

describe('Results for other rounds', () => {
  it('links a practice round to the check and to practice again', () => {
    renderResults(round({ mode: 'unit_practice', score: 8, total: 10 }, { missedItemIds: [] }), []);
    expect(hrefs()).toContain('/unit/b01-greetings/check');
    expect(hrefs()).toContain('/unit/b01-greetings/practice');
    expect(container.textContent).not.toContain('Words to revisit');
  });

  it('keeps Play again for free practice', () => {
    renderResults(round({ mode: 'match', unit_id: null, score: 8, total: 10 }, {}), []);
    expect(hrefs()).toContain('/play/beginner/match');
    expect(hrefs()).toContain('/practice');
  });
});

describe('roundPath', () => {
  it('routes unit rounds to their unit and free rounds to their game', () => {
    expect(roundPath({ level: 'beginner', mode: 'unit_check', unit_id: 'b01-greetings' }, true)).toBe(
      '/unit/b01-greetings/check?resume=1',
    );
    expect(roundPath({ level: 'beginner', mode: 'unit_practice', unit_id: 'b01-greetings' })).toBe(
      '/unit/b01-greetings/practice',
    );
    expect(roundPath({ level: 'intermediate', mode: 'order', unit_id: null }, true)).toBe(
      '/play/intermediate/order?resume=1',
    );
  });
});

vi.mock('../../data/roundRepo', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../data/roundRepo')>()),
  getRound: vi.fn(async () => null),
}));

describe('Results: new kiwiana', () => {
  it('shows a clear unlock card with a link to the collection', () => {
    renderResults(
      round({}, { unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true, treasureId: 'paua' } }),
      ['b01-greetings'],
    );
    expect(container.textContent).toContain('New kiwiana: Pāua!');
    expect(container.textContent).toContain('shimmering shell');
    expect(hrefs()).toContain('/kiwiana');
    expect(container.textContent).toContain('See your Kiwiana');
    expect(container.textContent).not.toContain('collected all 20');
  });

  it('gives the golden kiwi the big celebration', () => {
    renderResults(
      round({}, { unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true, treasureId: 'golden-kiwi' } }),
      ['b01-greetings'],
    );
    expect(container.textContent).toContain('New kiwiana: Golden kiwi!');
    expect(container.textContent).toContain('collected all 20 kiwiana treasures');
  });

  it('shows nothing about kiwiana when none was unlocked or the Kiwiz was missed', () => {
    renderResults(round({}, { unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true } }), ['b01-greetings']);
    expect(container.textContent).not.toContain('New kiwiana');
    renderResults(round({ score: 5 }, { unitCheck: { unitId: 'b01-greetings', passed: false, firstCompletion: false, treasureId: 'paua' } }), []);
    expect(container.textContent).not.toContain('New kiwiana');
  });
});

describe('Results: unlock dialog', () => {
  it('opens the unlock dialog with the name and story when a Kiwiz pass unlocks a treasure', () => {
    renderResults(
      round({}, { unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true, treasureId: 'paua' } }),
      ['b01-greetings'],
    );
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('You unlocked: Pāua!');
    expect(dialog.textContent).toContain('carvers have long used pāua shell');
    const close = [...dialog.querySelectorAll('button')].find((b) => b.textContent === 'Ka pai!')!;
    act(() => void close.click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.textContent).toContain('New kiwiana: Pāua!');
  });

  it('opens the story again from the icon on the unlock card', () => {
    renderResults(
      round({}, { unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true, treasureId: 'paua' } }),
      ['b01-greetings'],
    );
    act(() => {
      [...container.querySelectorAll('[role="dialog"] button')].find((b) => b.textContent === 'Ka pai!')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    const icon = container.querySelector('button[aria-label="Read about Pāua"]') as HTMLButtonElement;
    act(() => void icon.click());
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.querySelector('h2')?.textContent).toBe('Pāua');
  });

  it('has no dialog when nothing was unlocked', () => {
    renderResults(round({}, { unitCheck: { unitId: 'b01-greetings', passed: true, firstCompletion: true } }), ['b01-greetings']);
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});
