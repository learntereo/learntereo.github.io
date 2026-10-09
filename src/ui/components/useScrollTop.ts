import { useEffect, useRef } from 'react';

/** Jump to the top of the page straight away (not a smooth scroll). */
export function scrollToTop(): void {
  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  } catch {
    // Not available (for example in a test environment): nothing to do.
  }
}

/** Scroll to the top whenever `key` changes after the first render (the next card or question). */
export function useScrollTopOn(key: string | number): void {
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    scrollToTop();
  }, [key]);
}
