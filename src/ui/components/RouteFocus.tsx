import { useEffect } from 'react';
import { useLocation } from 'react-router';

export const APP_NAME = 'Ako';

/** Browser tab title for a screen: its main heading, then the app name. */
export function pageTitle(heading: string | null | undefined): string {
  const text = heading?.replace(/\s+/g, ' ').trim();
  return text ? `${text} | ${APP_NAME}` : APP_NAME;
}

function mainElement(): HTMLElement | null {
  return document.querySelector('main');
}

/** Move keyboard and screen reader focus to the page content. Used by the skip link. */
export function focusMain(): void {
  const main = mainElement();
  if (!main) return;
  main.setAttribute('tabindex', '-1');
  main.focus();
}

/**
 * After each navigation, set the tab title from the page heading and move
 * focus to the new page, so screen reader users hear the change and keyboard
 * users do not start from the top of the old page.
 */
export function RouteFocus() {
  const { pathname } = useLocation();

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
