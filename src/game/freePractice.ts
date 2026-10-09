import { eligibleModes } from './roundGenerator';
import type { Item, Level, Mode, Unit } from './types';
import type { UnitStatus } from './unitUnlock';

/** Items from units the learner has opened: Free Practice never asks about locked units. */
export function openItems(
  items: readonly Item[],
  units: readonly Unit[],
  statuses: ReadonlyMap<string, UnitStatus>,
): Item[] {
  const open = new Set(
    units.filter((u) => statuses.get(u.id)?.state !== 'locked').flatMap((u) => u.itemIds),
  );
  return items.filter((item) => open.has(item.id));
}

/** Games that have enough content in the open units of a level. Mixed needs at least one other game. */
export function availableModes(items: readonly Item[], level: Level): Mode[] {
  const eligible = eligibleModes(items, level);
  const modes: Mode[] = [...eligible];
  if (eligible.length > 0) modes.push('mixed');
  return modes;
}
