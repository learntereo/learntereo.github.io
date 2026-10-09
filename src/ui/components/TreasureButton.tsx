import { useCallback, useState, type ReactNode } from 'react';
import type { Treasure } from '../../game/treasures';
import { TreasureIcon } from './Treasure';
import { TreasureDialog } from './TreasureDialog';

interface Props {
  treasure: Treasure;
  size: number;
  className?: string;
  /** Text shown beside the icon (the name, a date, ...). */
  children?: ReactNode;
}

/**
 * An unlocked treasure you can press: a button, "Read about {name}", that opens
 * the story dialog (the finished state, no reveal animation). Only unlocked
 * treasures are ever given to this component.
 */
export function TreasureButton({ treasure, size, className, children }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button type="button" className={className} aria-label={`Read about ${treasure.name}`} onClick={() => setOpen(true)}>
        <TreasureIcon id={treasure.id} size={size} />
        {children}
      </button>
      {open && <TreasureDialog treasure={treasure} mode="view" onClose={close} />}
    </>
  );
}
