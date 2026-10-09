// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TREASURES } from '../../game/treasures';
import { TreasureDialog } from './TreasureDialog';

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

const treasure = (id: string) => TREASURES.find((t) => t.id === id)!;
const show = (id: string, mode: 'unlock' | 'view', onClose = () => {}) =>
  act(() =>
    root.render(
      <MemoryRouter>
        <TreasureDialog treasure={treasure(id)} mode={mode} onClose={onClose} />
      </MemoryRouter>,
    ),
  );
const dialog = () => container.querySelector('[role="dialog"]') as HTMLElement;

describe('TreasureDialog', () => {
  it('is a modal dialog labelled by its heading, with the name, caption and story', () => {
    show('paua', 'unlock');
    expect(dialog().getAttribute('aria-modal')).toBe('true');
    const heading = dialog().querySelector('h2')!;
    expect(dialog().getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent).toBe('You unlocked: Pāua!');
    expect(dialog().textContent).toContain(treasure('paua').caption);
    expect(dialog().textContent).toContain('set pāua into carvings as shining eyes');
    expect(dialog().textContent).toContain('See your Kiwiana');
  });

  it('announces a new rank only while unlocking', () => {
    act(() =>
      root.render(
        <MemoryRouter>
          <TreasureDialog treasure={treasure('paua')} mode="unlock" newRank="Kiwiana rookie" onClose={() => {}} />
        </MemoryRouter>,
      ),
    );
    expect(dialog().textContent).toContain('New rank: Kiwiana rookie!');
    show('paua', 'unlock');
    expect(dialog().textContent).not.toContain('New rank');
  });

  it('plays the reveal only when unlocking: a padlock tile sits over the treasure', () => {
    show('paua', 'unlock');
    expect(dialog().dataset.mode).toBe('unlock');
    expect(dialog().querySelectorAll('svg[data-locked="true"]')).toHaveLength(1);
    show('paua', 'view');
    expect(dialog().dataset.mode).toBe('view');
    expect(dialog().querySelectorAll('svg[data-locked="true"]')).toHaveLength(0);
    expect(dialog().querySelector('h2')?.textContent).toBe('Pāua');
  });

  it('gives the Golden kiwi sparkles while unlocking, and none when only viewing', () => {
    show('golden-kiwi', 'unlock');
    expect(dialog().querySelectorAll('svg[viewBox="0 0 100 100"]')).toHaveLength(1);
    show('golden-kiwi', 'view');
    expect(dialog().querySelectorAll('svg[viewBox="0 0 100 100"]')).toHaveLength(0);
  });

  it('closes with the Ka pai! button and with Escape, and focuses the button first', () => {
    const onClose = vi.fn();
    show('tui', 'unlock', onClose);
    const button = [...dialog().querySelectorAll('button')].find((b) => b.textContent === 'Ka pai!')!;
    expect(document.activeElement).toBe(button);
    act(() => void button.click());
    expect(onClose).toHaveBeenCalledTimes(1);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('keeps focus inside: Tab from the last control wraps to the first, and Shift+Tab back', () => {
    show('tui', 'unlock');
    const items = [...dialog().querySelectorAll<HTMLElement>('a[href], button')];
    const first = items[0];
    const last = items[items.length - 1];
    last.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    act(() => void document.dispatchEvent(tab));
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    const back = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    act(() => void document.dispatchEvent(back));
    expect(document.activeElement).toBe(last);
  });

  it('returns focus to what had it before when it closes', () => {
    const before = document.createElement('button');
    document.body.appendChild(before);
    before.focus();
    show('tui', 'view');
    act(() => root.render(<div />));
    expect(document.activeElement).toBe(before);
    before.remove();
  });

  it('has a reduced-motion path that skips the movement and shows the revealed state', () => {
    const css = readFileSync('src/ui/components/TreasureDialog.module.css', 'utf8');
    const block = css.slice(css.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toContain('.reveal .lock');
    expect(block).toMatch(/display:\s*none/);
    expect(block).toMatch(/transform:\s*none/);
    expect(block).toContain('opacity: 1');
    // The words are in the page straight away, so a screen reader hears them without waiting for the animation.
    show('kumara', 'unlock');
    expect(dialog().textContent).toContain('Polynesian voyagers');
  });
});
