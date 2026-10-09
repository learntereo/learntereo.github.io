// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PepehaPage } from './PepehaPage';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<PepehaPage />));
}

function type(name: string, value: string) {
  const el = container.querySelector<HTMLInputElement>(`[name="${name}"]`)!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  act(() => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function choose(kind: 'maori' | 'tauiwi') {
  act(() => container.querySelector<HTMLInputElement>(`input[name="kind"][value="${kind}"]`)!.click());
}

const button = (label: string) => [...container.querySelectorAll('button')].find((b) => b.textContent === label)!;
const miLines = () => [...container.querySelectorAll('[data-testid="pepeha-lines"] p[lang="mi"]')].map((p) => p.textContent);
const enLines = () => [...container.querySelectorAll('[data-testid="pepeha-lines"] p:not([lang])')].map((p) => p.textContent);

beforeEach(() => {
  window.localStorage.clear();
  mount();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe('Pepeha page', () => {
  it('asks the whakapapa question first and shows no other fields', () => {
    expect(container.querySelector('legend')?.textContent).toContain('Do you whakapapa Māori?');
    expect(container.querySelector('[name="name"]')).toBeNull();
    expect(container.querySelector('legend [lang="mi"]')?.textContent).toBe('Māori');
  });

  it('shows Māori-only fields for the Māori template', () => {
    choose('maori');
    for (const name of ['maunga', 'water', 'waka', 'iwi', 'hapu', 'marae', 'name']) {
      expect(container.querySelector(`[name="${name}"]`), name).not.toBeNull();
    }
    expect(container.querySelector('[name="born"]')).toBeNull();
  });

  it('hides waka, iwi, hapū and marae for tauiwi', () => {
    choose('tauiwi');
    for (const name of ['waka', 'iwi', 'hapu', 'marae']) {
      expect(container.querySelector(`[name="${name}"]`), name).toBeNull();
    }
    for (const name of ['ancestors1', 'ancestors2', 'born', 'grewUp', 'live', 'name']) {
      expect(container.querySelector(`[name="${name}"]`), name).not.toBeNull();
    }
  });

  it('drops empty fields and shows te reo with English underneath', () => {
    choose('maori');
    type('name', 'Aroha');
    type('iwi', 'Ngāi Tahu');
    expect(miLines()).toEqual(['Tēnā koutou katoa', 'Ko Ngāi Tahu te iwi', 'Ko Aroha tōku ingoa', 'Nō reira, tēnā koutou, tēnā koutou, tēnā koutou katoa']);
    expect(enLines()).toContain('Ngāi Tahu is my tribe');
  });

  it('uses the Māori name for a suggestion', () => {
    choose('tauiwi');
    type('name', 'Sam');
    type('live', 'Dunedin');
    expect(miLines()).toContain('Kei Ōtepoti au e noho ana');
    expect(enLines()).toContain('I live in Dunedin');
  });

  it('hides the English when asked', () => {
    choose('tauiwi');
    type('name', 'Sam');
    expect(enLines().length).toBeGreaterThan(0);
    act(() => container.querySelector<HTMLInputElement>('input[type="checkbox"]')!.click());
    expect(enLines()).toEqual([]);
    expect(miLines().length).toBeGreaterThan(0);
  });

  it('copies te reo only, one line per line, and says so', async () => {
    const writeText = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    choose('tauiwi');
    type('name', 'Sam');
    await act(async () => button('Copy pepeha').click());
    expect(writeText).toHaveBeenCalledWith(
      ['Tēnā koutou katoa.', 'Ko Sam tōku ingoa.', 'Nō reira, tēnā koutou, tēnā koutou, tēnā koutou katoa.'].join('\n'),
    );
    expect(container.querySelector('[role="status"]')?.textContent).toBe('Copied');
  });

  it('disables copy and print until there is a name', () => {
    choose('maori');
    expect(button('Copy pepeha').disabled).toBe(true);
    expect(button('Print').disabled).toBe(true);
    expect(container.textContent).toContain('Add your name to see your pepeha.');
  });

  it('remembers the form and clears it', () => {
    choose('tauiwi');
    type('name', 'Sam');
    expect(JSON.parse(window.localStorage.getItem('ako-pepeha-v1')!).name).toBe('Sam');

    act(() => root.unmount());
    container.remove();
    mount();
    expect(container.querySelector<HTMLInputElement>('[name="name"]')!.value).toBe('Sam');

    act(() => button('Clear').click());
    expect(container.querySelector('[name="name"]')).toBeNull();
    expect(window.localStorage.getItem('ako-pepeha-v1')).toBeNull();
  });

  it('works when storage is blocked', () => {
    act(() => root.unmount());
    container.remove();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    mount();
    choose('maori');
    type('name', 'Aroha');
    expect(miLines()).toContain('Ko Aroha tōku ingoa');
  });

  it('shows the review note and a link back to Ako', () => {
    expect(container.textContent).toContain('has not yet been reviewed by a fluent speaker');
    expect(container.querySelector<HTMLAnchorElement>('a')?.textContent).toContain('Learn te reo Māori with Ako');
  });
});
