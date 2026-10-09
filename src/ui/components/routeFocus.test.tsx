// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RouteFocus, SkipLink, pageTitle } from './RouteFocus';

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
  document.title = '';
});

describe('pageTitle', () => {
  it('uses the heading, then the app name', () => {
    expect(pageTitle('Your progress')).toBe('Your progress | Ako');
    expect(pageTitle('  Free\n practice ')).toBe('Free practice | Ako');
    expect(pageTitle(null)).toBe('Ako');
    expect(pageTitle('  ')).toBe('Ako');
  });
});

function Go({ to }: { to: string }) {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      go
    </button>
  );
}

describe('RouteFocus and SkipLink', () => {
  it('sets the title and focuses the page after navigating', async () => {
    act(() =>
      root.render(
        <MemoryRouter initialEntries={['/a']}>
          <SkipLink />
          <RouteFocus />
          <Go to="/b" />
          <Routes>
            <Route path="/a" element={<main><h1>Page A</h1></main>} />
            <Route path="/b" element={<main><h1>Page B</h1></main>} />
          </Routes>
        </MemoryRouter>,
      ),
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(document.title).toBe('Page A | Ako');
    expect(document.activeElement?.tagName).toBe('MAIN');

    act(() => {
      [...container.querySelectorAll('button')].find((b) => b.textContent === 'go')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(document.title).toBe('Page B | Ako');
    expect(document.activeElement?.textContent).toBe('Page B');
  });

  it('skip link moves focus to the main content', () => {
    act(() =>
      root.render(
        <MemoryRouter>
          <SkipLink />
          <main>
            <h1>Content</h1>
          </main>
        </MemoryRouter>,
      ),
    );
    act(() => {
      [...container.querySelectorAll('button')].find((b) => b.textContent === 'Skip to content')!.dispatchEvent(
        new MouseEvent('click', { bubbles: true }),
      );
    });
    expect(document.activeElement?.tagName).toBe('MAIN');
  });
});
