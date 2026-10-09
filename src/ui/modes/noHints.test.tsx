// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allItems, unitsById } from '../../content/content';
import { generateUnitCheck } from '../../game/unitRound';
import { createRng } from '../../game/rng';
import type { Outcome, Question } from '../../game/types';
import { BoardGame } from './BoardGame';

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

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function matchQuestion(): Question {
  const unit = unitsById.get('b01-greetings')!;
  for (let seed = 1; seed < 50; seed++) {
    const q = generateUnitCheck(unit, allItems, createRng(seed)).find((x) => x.mode === 'match');
    if (q) return q;
  }
  throw new Error('no match question');
}

describe('Match board in a unit check (hints off)', () => {
  it('bounces wrong drops without ever showing the right spot, and still counts a miss', () => {
    const question = matchQuestion();
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<BoardGame question={question} level="beginner" hints={false} onDone={onDone} />));

    const chips = () => [...container.querySelectorAll('button[aria-roledescription]')] as HTMLButtonElement[];
    const targets = () => [...container.querySelectorAll('button[aria-label^="Drop target"]')] as HTMLButtonElement[];
    const items = question.itemIds.map((id) => allItems.find((i) => i.id === id)!);
    const [first, second] = items;
    const chipFor = (mi: string) => chips().find((c) => c.textContent === mi)!;
    const targetFor = (en: string) => targets().find((t) => t.textContent === en)!;

    for (let i = 0; i < 3; i++) {
      click(chipFor(first.mi));
      click(targetFor(second.en[0]));
    }
    expect(container.textContent).not.toContain('highlighted');
    expect(container.querySelector('[aria-label*="correct spot"]')).toBeNull();
    expect(container.textContent).not.toContain(`Here: ${first.mi}`);

    for (const item of items) {
      click(chipFor(item.mi));
      click(targets().find((t) => t.textContent?.startsWith(item.en[0]))!);
    }
    click([...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Continue')!);
    const outcome = onDone.mock.calls[0][0];
    expect(outcome.result).toBe('missed');
    expect(outcome.items.find((i) => i.itemId === first.id)?.correct).toBe(false);
  });
});
