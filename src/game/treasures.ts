import type { Unit } from './types';
import type { UnitStatus } from './unitUnlock';

/** A collectible kiwiana treasure, placed on the Path after one unit. */
export interface Treasure {
  id: string;
  name: string;
  /** One friendly line, shown when the treasure is tapped. */
  caption: string;
  /** Course position (1-based) of the unit it follows. Passing that unit's Kiwiz unlocks it. */
  afterUnit: number;
}

/** In collection order. Placement: after units 2, 4, 6 and 8 (end of Beginner), 10, 12, 14 and 16 (end of Intermediate), 19 and 22 (end of the course). */
export const TREASURES: readonly Treasure[] = [
  { id: 'paua', name: 'Pāua', caption: "Pāua: the shimmering shell of Aotearoa's rocky shores", afterUnit: 2 },
  { id: 'jandals', name: 'Jandals', caption: 'Jandals: what New Zealanders call flip-flops, perfect for the beach', afterUnit: 4 },
  { id: 'silver-fern', name: 'Silver fern', caption: 'Silver fern (ponga): its leaves are silver underneath and glow in the moonlight', afterUnit: 6 },
  { id: 'pohutukawa', name: 'Pōhutukawa', caption: 'Pōhutukawa: the coastal tree with red flowers that bloom around Christmas', afterUnit: 8 },
  { id: 'gumboot', name: 'Gumboot', caption: 'Gumboot: the rubber boot every farm and garden needs', afterUnit: 10 },
  { id: 'pavlova', name: 'Pavlova', caption: 'Pavlova: a meringue dessert with cream and fruit, a summer favourite', afterUnit: 12 },
  { id: 'fish-and-chips', name: 'Fish and chips', caption: 'Fish and chips: a classic takeaway to eat by the beach', afterUnit: 14 },
  { id: 'hokey-pokey', name: 'Hokey pokey ice cream', caption: 'Hokey pokey: vanilla ice cream with crunchy toffee pieces', afterUnit: 16 },
  { id: 'tui', name: 'Tūī', caption: 'Tūī: a forest bird with a white tuft at its throat and a beautiful song', afterUnit: 19 },
  { id: 'golden-kiwi', name: 'Golden kiwi', caption: 'Golden kiwi: you found them all! The kiwi is the bird that lives only in Aotearoa', afterUnit: 22 },
];

export const TREASURE_COUNT = TREASURES.length;

export interface TreasureSlot {
  treasure: Treasure;
  /** The unit it follows on the Path (its Kiwiz unlocks the treasure). */
  unit: Unit;
}

/** The treasures with the unit each one follows, for units in course order. Treasures past the end of the course are left out. */
export function treasureSlots(units: readonly Unit[]): TreasureSlot[] {
  return TREASURES.flatMap((treasure) => {
    const unit = units[treasure.afterUnit - 1];
    return unit ? [{ treasure, unit }] : [];
  });
}

/** The slot shown after a given unit (at most one). */
export function treasureAfter(unitId: string, slots: readonly TreasureSlot[]): TreasureSlot | undefined {
  return slots.find((s) => s.unit.id === unitId);
}

/** Treasures whose unit is complete (including units complete through the PoC migration rule). */
export function unlockedTreasureIds(
  slots: readonly TreasureSlot[],
  statuses: ReadonlyMap<string, UnitStatus>,
): Set<string> {
  return new Set(slots.filter((s) => statuses.get(s.unit.id)?.state === 'complete').map((s) => s.treasure.id));
}

/** Treasure ids unlocked in `after` that were not in `before`, in collection order. */
export function newlyUnlockedTreasureIds(
  slots: readonly TreasureSlot[],
  before: ReadonlyMap<string, UnitStatus>,
  after: ReadonlyMap<string, UnitStatus>,
): string[] {
  const was = unlockedTreasureIds(slots, before);
  return [...unlockedTreasureIds(slots, after)].filter((id) => !was.has(id));
}
