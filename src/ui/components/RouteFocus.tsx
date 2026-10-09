import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router';
import { focusMain, mainElement, pageTitle } from './pageFocus';
import { scrollToTop } from './useScrollTop';

/**
 * After each navigation, set the tab title from the page heading and move
 * focus to the new page, so screen reader users hear the change and keyboard
 * users do not start from the top of the old page.
 */
export function RouteFocus() {
  const { pathname } = useLocation();

  // A new page starts at the top. Query-only changes (such as ?resume=1) keep the same pathname, so they do not scroll.
  useLayoutEffect(() => {
    scrollToTop();
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const main = mainElement();
      document.title = pageTitle(main?.querySelector('h1')?.textContent);
      if (main) {
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll: true });
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

/** First thing in the tab order: jumps over the header and tab bar. */
export function SkipLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={focusMain}>
      Skip to content
    </button>
  );
}
