// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getTitleBreakdown, itemsById } from '../../content/content';
import { loadParticles } from '../../content/particles';
import { searchParticles } from '../../game/glossarySearch';
import type { Breakdown as BreakdownData } from '../../game/types';
import { LittleWords } from '../screens/LittleWords';
import { literalFor } from '../../game/display';
import { Breakdown, BreakdownDisclosure, TitleBreakdown } from './Breakdown';
import { LiteralLine } from './LiteralLine';

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

const flush = () => act(async () => void (await new Promise((r) => setTimeout(r, 20))));

function render(node: React.ReactNode) {
  act(() => root.render(<MemoryRouter>{node}</MemoryRouter>));
}

const wordButtons = () => [...container.querySelectorAll<HTMLButtonElement>('button[aria-haspopup="dialog"]')];
const sentence = () => itemsById.get('s-b-001')!.breakdown as BreakdownData;

describe('Breakdown', () => {
  it('shows each word with its gloss under it, then the literal English and the note', () => {
    render(<Breakdown breakdown={sentence()} />);
    expect(wordButtons().map((b) => b.textContent)).toEqual([
      'Kei teis / am ...ing (present tense)',
      'paigood',
      'ahauI / me',
    ]);
    expect(container.textContent).toContain('Literally: is good I');
    expect(container.textContent).toContain('Kei te says the action is happening now');
  });

  it('opens a popover for a word with the particle explanation and marks the button expanded (AC4)', async () => {
    render(<Breakdown breakdown={itemsById.get('s-b-020')!.breakdown as BreakdownData} />);
    await loadParticles();
    const nga = wordButtons().find((b) => b.textContent?.startsWith('ngā'))!;
    expect(nga.getAttribute('aria-expanded')).toBe('false');
    act(() => nga.click());
    await flush();
    expect(nga.getAttribute('aria-expanded')).toBe('true');
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('the (plural)');
    expect(dialog.textContent).toContain('more than one thing');
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/little-words#little-nga');
    expect(nga.getAttribute('aria-controls')).toBe(dialog.id);
  });

  it('closes on Escape and returns focus to the word', async () => {
    render(<Breakdown breakdown={sentence()} />);
    const first = wordButtons()[0];
    act(() => first.click());
    await flush();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(first);
  });

  it('closes on a click outside, and closes when the same word is tapped again', () => {
    render(
      <div>
        <Breakdown breakdown={sentence()} />
        <p id="elsewhere">elsewhere</p>
      </div>,
    );
    act(() => wordButtons()[1].click());
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    act(() => {
      container.querySelector('#elsewhere')!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    act(() => wordButtons()[1].click());
    act(() => wordButtons()[1].click());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('gives a plain word (no particle) a gloss-only popover', () => {
    render(<Breakdown breakdown={sentence()} />);
    act(() => wordButtons()[1].click());
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('means good');
    expect(dialog.querySelector('a')).toBeNull();
  });
});

describe('BreakdownDisclosure and TitleBreakdown', () => {
  it('collapses the breakdown behind a Word by word toggle on a narrow screen', () => {
    render(<BreakdownDisclosure breakdown={sentence()} />);
    const details = container.querySelector('details')!;
    expect(details.querySelector('summary')?.textContent).toBe('Word by word');
    expect(details.open).toBe(false);
  });

  it('renders nothing without a breakdown', () => {
    render(<BreakdownDisclosure breakdown={undefined} />);
    expect(container.querySelector('details')).toBeNull();
  });

  it('shows the unit title meaning on request (AC1)', () => {
    expect(getTitleBreakdown('b01-greetings')).toBeDefined();
    render(<TitleBreakdown unitId="b01-greetings" />);
    const toggle = container.querySelector<HTMLButtonElement>('button[aria-expanded]')!;
    expect(toggle.textContent).toBe('What does this mean?');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(container.textContent).not.toContain('the greetings');
    act(() => toggle.click());
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(container.textContent).toContain('the (plural)');
    expect(container.textContent).toContain('greeting(s)');
    expect(container.textContent).toContain('Literally: the greetings');
  });

  it('explains kia ora with the idiom note (AC2)', () => {
    render(<Breakdown breakdown={itemsById.get('w-b-057')!.breakdown as BreakdownData} />);
    expect(container.textContent).toContain('well, healthy, alive');
    expect(container.textContent).toContain('hello');
    expect(container.textContent).toContain('thank you');
  });
});

describe('Little words (AC5)', () => {
  it('finds nga when searching without macrons', async () => {
    const all = await loadParticles();
    expect(searchParticles(all, 'nga').map((p) => p.id)).toContain('nga');
    expect(searchParticles(all, 'KEI TE').map((p) => p.id)).toContain('kei-te');
    expect(searchParticles(all, 'zzzz')).toEqual([]);
    expect(searchParticles(all, '')).toHaveLength(all.length);
  });

  it('lists the dictionary and filters it from the search box', async () => {
    render(<LittleWords />);
    await flush();
    expect(container.querySelectorAll('li').length).toBeGreaterThan(25);
    const input = container.querySelector('input')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'nga');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    const titles = [...container.querySelectorAll('li h2')].map((h) => h.textContent);
    expect(titles).toContain('ngā');
    expect(container.textContent).toContain('the (plural)');
  });
});

describe('Literal meaning line', () => {
  it('shows what kia ora literally means under its meaning', () => {
    render(<LiteralLine item={itemsById.get('w-b-057')!} />);
    expect(container.textContent).toBe('Literally: “be healthy, be well”');
  });

  it('shows the Tēnā koe family literally as "that (is) you"', () => {
    expect(literalFor(itemsById.get('w-b-066')!)).toBe('that (is) you two');
    expect(literalFor(itemsById.get('w-b-067')!)).toBe('that (is) you all');
    const tena = itemsById.get('s-b-009')!.breakdown!;
    expect(tena.tokens[0]).toMatchObject({ en: 'that (near you)', ref: 'tenei' });
    expect(tena.literal).toBe('that (is) you');
    expect(tena.note).toContain('respectful hello to one person');
  });

  it('shows nothing when the literal is the same as the meaning', () => {
    const thousand = itemsById.get('w-a-008')!;
    expect(thousand.breakdown?.literal?.toLowerCase()).toBe(thousand.en[0].toLowerCase());
    render(<LiteralLine item={thousand} />);
    expect(container.textContent).toBe('');
  });

  it('shows nothing for single words and for sentences (they have the Word by word panel)', () => {
    expect(literalFor(itemsById.get('w-b-059')!)).toBeUndefined();
    expect(literalFor(itemsById.get('s-b-001')!)).toBeUndefined();
  });

  it('ignores case and punctuation when comparing', () => {
    expect(literalFor({ kind: 'word', en: ['Hello!'], breakdown: { literal: 'hello' } })).toBeUndefined();
    expect(literalFor({ kind: 'word', en: ['hello'], breakdown: { literal: 'be well' } })).toBe('be well');
  });
});
