// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteBeforeCursor, insertAtCursor } from '../../game/macronMarking';
import type { Question } from '../../game/types';
import { Write } from './Write';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  window.localStorage.clear();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const question: Question = { mode: 'write', itemIds: ['w-b-040'], requeued: false };
const input = () => container.querySelector('input') as HTMLInputElement;
const key = (label: string) => container.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
const press = (label: string) => act(() => void key(label).dispatchEvent(new MouseEvent('click', { bubbles: true })));

function typeText(value: string, start: number, end = start) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value);
    input().dispatchEvent(new Event('input', { bubbles: true }));
    input().setSelectionRange(start, end);
  });
}

function mount(coarse = false) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: coarse && query.includes('coarse'), media: query }));
  act(() => root.render(<Write question={question} level="beginner" onDone={() => {}} />));
}

describe('keyboard helpers', () => {
  it('inserts at the cursor and replaces a selection', () => {
    expect(insertAtCursor('kai', 1, 1, 'ng')).toEqual({ value: 'kngai', cursor: 3 });
    expect(insertAtCursor('kai', 0, 3, 'wh')).toEqual({ value: 'wh', cursor: 2 });
  });

  it('deletes the character before the cursor, or the selection', () => {
    expect(deleteBeforeCursor('whare', 2, 2)).toEqual({ value: 'ware', cursor: 1 });
    expect(deleteBeforeCursor('whare', 0, 0)).toEqual({ value: 'whare', cursor: 0 });
    expect(deleteBeforeCursor('whare', 1, 4)).toEqual({ value: 'we', cursor: 1 });
    expect(deleteBeforeCursor('wh', null, null)).toEqual({ value: 'w', cursor: 1 });
  });
});

describe('on-screen Māori keyboard in Write', () => {
  it('lists the keys in Māori alphabet order, then macron vowels, space and backspace', () => {
    mount();
    const labels = [...container.querySelectorAll('[aria-label="Māori letters"] button')].map((b) => b.getAttribute('aria-label'));
    expect(labels).toEqual([
      ...['a', 'e', 'h', 'i', 'k', 'm', 'n', 'o', 'p', 'r', 't', 'u', 'w', 'ng', 'wh'].map((l) => `letter ${l}`),
      ...['ā', 'ē', 'ī', 'ō', 'ū'].map((l) => `letter ${l}`),
      'space',
      'backspace',
    ]);
  });

  it('inserts letters, including the digraph keys, at the cursor and keeps the caret after them', () => {
    mount();
    press('letter ng');
    press('letter e');
    press('letter r');
    press('letter u');
    expect(input().value).toBe('ngeru');
    expect(input().selectionStart).toBe(5);

    typeText('mama', 1);
    press('letter wh');
    expect(input().value).toBe('mwhama');
    expect(input().selectionStart).toBe(3);
    press('letter ā');
    expect(input().value).toBe('mwhāama');
    expect(input().selectionStart).toBe(4);
  });

  it('inserts a space and deletes before the cursor, or the selected text', () => {
    mount();
    typeText('kia ora', 3);
    press('backspace');
    expect(input().value).toBe('ki ora');
    expect(input().selectionStart).toBe(2);
    press('space');
    expect(input().value).toBe('ki  ora');
    typeText('kia ora', 0, 4);
    press('backspace');
    expect(input().value).toBe('ora');
    expect(input().selectionStart).toBe(0);
  });

  it('does nothing on backspace at the very start, and keys never take focus on press', () => {
    mount();
    typeText('ae', 0);
    press('backspace');
    expect(input().value).toBe('ae');
    const down = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    act(() => void key('letter a').dispatchEvent(down));
    expect(down.defaultPrevented).toBe(true);
  });

  it('keys are real buttons that are at least 44px tall by style and typing still works', () => {
    mount();
    expect(key('letter a').tagName).toBe('BUTTON');
    expect(key('letter a').getAttribute('type')).toBe('button');
    typeText('kuri', 4);
    expect(input().value).toBe('kuri');
  });
});

describe('phone keyboard toggle', () => {
  it('is hidden on a mouse device, which keeps the normal input mode', () => {
    mount(false);
    expect(container.textContent).not.toContain('Use phone keyboard');
    expect(input().getAttribute('inputmode')).toBe('text');
  });

  it('on a touch device starts off (inputMode none) and turns the phone keyboard on and off', () => {
    mount(true);
    const toggle = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(container.textContent).toContain('Use phone keyboard');
    expect(toggle.checked).toBe(false);
    expect(input().getAttribute('inputmode')).toBe('none');
    act(() => void toggle.click());
    expect(toggle.checked).toBe(true);
    expect(input().getAttribute('inputmode')).toBe('text');
    expect(window.localStorage.getItem('ako.usePhoneKeyboard')).toBe('1');
    act(() => void toggle.click());
    expect(input().getAttribute('inputmode')).toBe('none');
    expect(window.localStorage.getItem('ako.usePhoneKeyboard')).toBe('0');
  });

  it('remembers the choice next time', () => {
    window.localStorage.setItem('ako.usePhoneKeyboard', '1');
    mount(true);
    expect((container.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);
    expect(input().getAttribute('inputmode')).toBe('text');
  });

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mount(true);
    const toggle = container.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    act(() => void toggle.click());
    expect(toggle.checked).toBe(true);
    vi.restoreAllMocks();
  });
});
