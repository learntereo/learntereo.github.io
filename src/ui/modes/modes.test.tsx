// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { allItems } from '../../content/content';
import { generateRound } from '../../game/roundGenerator';
import { createRng } from '../../game/rng';
import type { Outcome, Question } from '../../game/types';
import { BoardGame } from './BoardGame';
import { Order } from './Order';
import { Translate } from './Translate';

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

function render(node: React.ReactNode) {
  act(() => root.render(node));
}

function click(el: Element) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function button(text: string): HTMLButtonElement {
  const found = [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text);
  if (!found) throw new Error(`No button "${text}"`);
  return found as HTMLButtonElement;
}

function questionOf(mode: 'match' | 'picture' | 'translate' | 'order'): Question {
  const questions = generateRound(allItems, 'beginner', mode, new Set(), createRng(5));
  return questions[0];
}

describe('Translate', () => {
  it('marks a typed answer correct on the first try', () => {
    const question = questionOf('translate');
    const item = allItems.find((i) => i.id === question.itemIds[0])!;
    const onDone = vi.fn<(o: Outcome) => void>();
    render(<Translate question={question} level="beginner" onDone={onDone} />);

    const input = container.querySelector('input')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, item.en[0].toUpperCase() + '!');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(button('Check'));
    expect(container.textContent).toContain('Ka pai!');
    click(button('Continue'));
    expect(onDone).toHaveBeenCalledWith({
      result: 'first',
      requeued: false,
      items: [{ itemId: item.id, correct: true }],
    });
  });

  it('allows one retry then reveals the answer and counts as missed', () => {
    const question = questionOf('translate');
    const item = allItems.find((i) => i.id === question.itemIds[0])!;
    const onDone = vi.fn<(o: Outcome) => void>();
    render(<Translate question={question} level="beginner" onDone={onDone} />);

    const type = (value: string) => {
      const input = container.querySelector('input')!;
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
        setter.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      click(button('Check'));
    };

    type('zzzzzzzzzzzz');
    expect(container.textContent).toContain('Not quite, try again');
    type('qqqqqqqqqqqq');
    expect(container.textContent).toContain(item.en[0]);
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'missed', items: [{ itemId: item.id, correct: false }] });
  });
});

describe('Order', () => {
  it('lets the learner tap tiles into the answer row and checks the order', () => {
    const question = questionOf('order');
    const sentence = allItems.find((i) => i.id === question.itemIds[0])!;
    if (sentence.kind !== 'sentence') throw new Error('expected a sentence');
    const onDone = vi.fn<(o: Outcome) => void>();
    render(<Order question={question} level="beginner" onDone={onDone} />);

    expect(button('Check').disabled).toBe(true);
    const bankCount = container.querySelectorAll('[aria-label="Word bank"] button').length;
    expect(bankCount).toBe(sentence.tiles.length + (question.decoys?.length ?? 0));

    for (const tile of sentence.tiles) {
      const inBank = [...container.querySelectorAll('[aria-label="Word bank"] button')].find(
        (b) => b.textContent === tile,
      )!;
      click(inBank);
    }
    // Decoys stay in the bank.
    expect(container.querySelectorAll('[aria-label="Word bank"] button')).toHaveLength(question.decoys!.length);

    click(button('Check'));
    expect(container.textContent).toContain('Ka pai!');
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'first' });
  });

  it('shows the word-by-word breakdown after answering, not before (AC3)', () => {
    const question = questionOf('order');
    const sentence = allItems.find((i) => i.id === question.itemIds[0])!;
    if (sentence.kind !== 'sentence' || !sentence.breakdown) throw new Error('expected a sentence with a breakdown');
    render(<Order question={question} level="beginner" onDone={vi.fn()} />);
    expect(container.textContent).not.toContain('Word by word');

    for (const tile of sentence.tiles) {
      click([...container.querySelectorAll('[aria-label="Word bank"] button')].find((b) => b.textContent === tile)!);
    }
    click(button('Check'));
    expect(container.querySelector('details summary')?.textContent).toBe('Word by word');
    for (const token of sentence.breakdown.tokens) {
      expect(container.textContent).toContain(token.en);
    }
  });
});

describe('Match board', () => {
  it('supports tap-to-select, wrong drops, reveal after 2, and completion', () => {
    const question = questionOf('match');
    const onDone = vi.fn<(o: Outcome) => void>();
    render(<BoardGame question={question} level="beginner" onDone={onDone} />);

    const chips = () => [...container.querySelectorAll('button[aria-roledescription]')] as HTMLButtonElement[];
    const targets = () =>
      [...container.querySelectorAll('button[aria-label^="Drop target"]')] as HTMLButtonElement[];
    expect(chips()).toHaveLength(5);
    expect(targets()).toHaveLength(5);

    const items = question.itemIds.map((id) => allItems.find((i) => i.id === id)!);
    const [first, second] = items;
    const chipFor = (mi: string) => chips().find((c) => c.textContent === mi)!;
    const targetFor = (en: string) => targets().find((t) => t.textContent === en)!;

    // Two wrong drops on the first word reveals its spot.
    click(chipFor(first.mi));
    click(targetFor(second.en[0]));
    expect(container.textContent).toContain('Not quite, try again');
    click(chipFor(first.mi));
    click(targetFor(second.en[0]));
    expect(container.textContent).toContain('highlighted');

    // Place everything correctly.
    for (const item of items) {
      click(chipFor(item.mi));
      click(
        ([...container.querySelectorAll('button[aria-label^="Drop target"]')] as HTMLButtonElement[]).find((t) =>
          t.textContent?.startsWith(item.en[0]),
        )!,
      );
    }
    click(button('Continue'));
    const outcome = onDone.mock.calls[0][0];
    expect(outcome.result).toBe('missed');
    expect(outcome.items.find((i) => i.itemId === first.id)?.correct).toBe(false);
    expect(outcome.items.filter((i) => i.correct)).toHaveLength(4);
  });

  it('is first-try when every drop is right', () => {
    const question = questionOf('picture');
    const onDone = vi.fn<(o: Outcome) => void>();
    render(<BoardGame question={question} level="beginner" onDone={onDone} />);
    expect(container.querySelectorAll('button[aria-label^="Drop target"]')).toHaveLength(4);

    const items = question.itemIds.map((id) => allItems.find((i) => i.id === id)!);
    for (const item of items) {
      const chip = [...container.querySelectorAll('button[aria-roledescription]')].find(
        (c) => c.textContent === item.mi,
      )!;
      click(chip);
      click(container.querySelector(`button[aria-label="Drop target: ${item.en[0]}"]`)!);
    }
    click(button('Continue'));
    expect(onDone.mock.calls[0][0].result).toBe('first');
  });
});
