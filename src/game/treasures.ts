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

/** In collection order. Treasure N follows unit N (1 to 19). The 20th, the Golden kiwi, follows the last unit (22). */
export const TREASURES: readonly Treasure[] = [
  { id: 'paua', name: 'Pāua', caption: "Pāua: the shimmering shell of Aotearoa's rocky shores", afterUnit: 1 },
  { id: 'jandals', name: 'Jandals', caption: 'Jandals: what New Zealanders call flip-flops, perfect for the beach', afterUnit: 2 },
  { id: 'silver-fern', name: 'Silver fern', caption: 'Silver fern (ponga): the undersides of its fronds are silver and catch the moonlight', afterUnit: 3 },
  { id: 'pohutukawa', name: 'Pōhutukawa', caption: 'Pōhutukawa: the coastal tree with red flowers that bloom around Christmas', afterUnit: 4 },
  { id: 'gumboot', name: 'Gumboot', caption: 'Gumboot: the rubber boot every farm and garden needs', afterUnit: 5 },
  { id: 'pavlova', name: 'Pavlova', caption: 'Pavlova: a meringue dessert with cream and fruit, a summer favourite', afterUnit: 6 },
  { id: 'fish-and-chips', name: 'Fish and chips', caption: 'Fish and chips: a classic takeaway to eat by the beach', afterUnit: 7 },
  { id: 'hokey-pokey', name: 'Hokey pokey ice cream', caption: 'Hokey pokey: vanilla ice cream with crunchy toffee pieces', afterUnit: 8 },
  { id: 'tui', name: 'Tūī', caption: 'Tūī: a forest bird with a white tuft at its throat and a beautiful song', afterUnit: 9 },
  { id: 'pukeko', name: 'Pūkeko', caption: 'Pūkeko: a blue swamp bird with a red beak and long legs, often seen in paddocks', afterUnit: 10 },
  { id: 'kumara', name: 'Kūmara', caption: 'Kūmara: the sweet potato brought to Aotearoa by early Māori voyagers', afterUnit: 11 },
  { id: 'kowhai', name: 'Kōwhai', caption: 'Kōwhai: a native tree with golden flowers in spring that tūī love', afterUnit: 12 },
  { id: 'weta', name: 'Wētā', caption: 'Wētā: a big, gentle native insect, a bit like a cricket with long feelers', afterUnit: 13 },
  { id: 'tuatara', name: 'Tuatara', caption: 'Tuatara: a reptile found only in Aotearoa, from a family as old as the dinosaurs', afterUnit: 14 },
  { id: 'kereru', name: 'Kererū', caption: 'Kererū: the large native wood pigeon with a white chest and noisy wings', afterUnit: 15 },
  { id: 'piwakawaka', name: 'Pīwakawaka', caption: 'Pīwakawaka (fantail): a tiny bird that flits about with its tail spread like a fan', afterUnit: 16 },
  { id: 'feijoa', name: 'Feijoa', caption: 'Feijoa: a green fruit with sweet, gritty flesh that ripens in autumn', afterUnit: 17 },
  { id: 'chilly-bin', name: 'Chilly bin', caption: 'Chilly bin: the insulated box that keeps food and drinks cold on the way to the beach', afterUnit: 18 },
  { id: 'number-8-wire', name: 'Number 8 wire', caption: 'Number 8 wire: fencing wire Kiwis use to fix almost anything', afterUnit: 19 },
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

/** The first treasure that is still locked, in collection order (the next one to aim for). */
export function nextTreasure(
  slots: readonly TreasureSlot[],
  statuses: ReadonlyMap<string, UnitStatus>,
): TreasureSlot | undefined {
  const got = unlockedTreasureIds(slots, statuses);
  return slots.find((slot) => !got.has(slot.treasure.id));
}
