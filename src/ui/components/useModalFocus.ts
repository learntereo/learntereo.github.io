import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled])';

/**
 * Keeps keyboard focus inside a modal dialog: focus starts on the close button, Tab wraps
 * round, Escape closes it, and focus goes back to where it was when it closes.
 */
export function useModalFocus(
  dialog: RefObject<HTMLElement | null>,
  closeButton: RefObject<HTMLElement | null>,
  onClose: () => void,
): void {
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeButton.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      const root = dialog.current;
      if (event.key !== 'Tab' || !root) return;
      const nodes = [...root.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;
      if (!root.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      before?.focus?.();
    };
  }, [dialog, closeButton, onClose]);
}
