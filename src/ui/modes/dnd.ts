import { KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * Mouse, touch and keyboard sensors shared by every drag board.
 * - Pointer: starts after 4px so taps still register as clicks.
 * - Touch: a short press (100ms) with a small tolerance, so scrolling is not hijacked.
 * - Keyboard: Space picks up and drops; Enter is left free to act as a click (tap-to-move).
 */
export function useDragSensors(sortable = false) {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(KeyboardSensor, {
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space'] },
      ...(sortable ? { coordinateGetter: sortableKeyboardCoordinates } : {}),
    }),
  );
}
