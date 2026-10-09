// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getItem } from '../../content/content';
import type { Outcome, Question, SentenceItem } from '../../game/types';
import { Gap } from './Gap';
import { Write } from './Write';

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

const button = (text: string) =>
  [...container.querySelectorAll('button')].find((b) => b.textContent?.trim() === text) as HTMLButtonElement;

function type(value: string, cursor?: number) {
  const input = container.querySelector('input')!;
  act(() => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    if (cursor !== undefined) input.setSelectionRange(cursor, cursor);
  });
}

const writeQuestion = (id: string): Question => ({ mode: 'write', itemIds: [id], requeued: false });

describe('Write', () => {
  it('accepts a missing macron with a reminder and counts it as first try (AC6)', () => {
    const dog = getItem('w-b-001')!;
    expect(dog.mi).toBe('kurī');
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<Write question={writeQuestion(dog.id)} level="beginner" onDone={onDone} />));
    expect(container.textContent).toContain('dog');

    type('kuri');
    click(button('Check'));
    expect(container.textContent).toContain('Correct, watch the macron: kurī');
    click(button('Continue'));
    expect(onDone).toHaveBeenCalledWith({ result: 'first', requeued: false, items: [{ itemId: dog.id, correct: true }] });
  });

  it('inserts a macron at the cursor from the keyboard row (AC7)', () => {
    act(() => root.render(<Write question={writeQuestion('w-b-040')} level="beginner" onDone={() => {}} />));
    type('mama', 1);
    click(button('ā'));
    expect((container.querySelector('input') as HTMLInputElement).value).toBe('māama');
    expect(container.querySelectorAll('[aria-label="Macron letters"] button')).toHaveLength(10);
  });

  it('allows one retry, then shows the answer and counts as missed', () => {
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<Write question={writeQuestion('w-b-001')} level="beginner" onDone={onDone} />));
    type('ngeru');
    click(button('Check'));
    expect(container.textContent).toContain('Not quite, try again');
    type('poaka');
    click(button('Check'));
    expect(container.textContent).toContain('The answer is: kurī');
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'missed' });
  });

  it('scores a right answer after one retry as retry', () => {
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<Write question={writeQuestion('w-b-001')} level="beginner" onDone={onDone} />));
    type('ngeru');
    click(button('Check'));
    type('kurī');
    click(button('Check'));
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'retry' });
  });
});

describe('Fill the gap', () => {
  const sentence = getItem('s-b-004') as SentenceItem; // He ngeru tēnei
  const question = (): Question => ({ mode: 'gap', itemIds: [sentence.id], requeued: false, gapIndex: 1, options: ['ngeru', 'kurī', 'hipi', 'kiwi'] });

  it('marks the right word correct on a tap (AC8)', () => {
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<Gap question={question()} level="beginner" onDone={onDone} />));
    expect(container.textContent).toContain('This is a cat');
    click(button('ngeru'));
    expect(container.textContent).toContain('Ka pai!');
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'first', items: [{ itemId: sentence.id, correct: true }] });
  });

  it('follows the retry then reveal rules for wrong words', () => {
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<Gap question={question()} level="beginner" onDone={onDone} />));
    click(button('kurī'));
    expect(container.textContent).toContain('Not quite, try again');
    click(button('hipi'));
    expect(container.textContent).toContain('The missing word is: ngeru');
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'missed' });
  });

  it('counts a right word after one wrong word as retry', () => {
    const onDone = vi.fn<(o: Outcome) => void>();
    act(() => root.render(<Gap question={question()} level="beginner" onDone={onDone} />));
    click(button('kiwi'));
    click(button('ngeru'));
    click(button('Continue'));
    expect(onDone.mock.calls[0][0]).toMatchObject({ result: 'retry' });
  });
});
