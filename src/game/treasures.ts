import type { Unit } from './types';
import type { UnitStatus } from './unitUnlock';

/** A collectible kiwiana treasure, placed on the Path after one unit. */
export interface Treasure {
  id: string;
  name: string;
  /** One friendly line, shown when the treasure is tapped. */
  caption: string;
  /** Two to four short sentences on its history or meaning, shown once it is unlocked. */
  story: string;
  /** Course position (1-based) of the unit it follows. Passing that unit's Kiwiz unlocks it. */
  afterUnit: number;
}

/** In collection order. Treasure N follows unit N (1 to 19). The 20th, the Golden kiwi, follows the last unit (22). */
export const TREASURES: readonly Treasure[] = [
  { id: 'paua', name: 'Pāua', caption: "Pāua: the shimmering shell of New Zealand's rocky shores", story:
      "Pāua are sea snails that cling to rocky shores around New Zealand. The inside of the shell flashes blue, green and purple, and Māori carvers have long used pāua shell for the eyes of carved figures. The flesh is a traditional food, gathered by hand.",
    afterUnit: 1 },
  { id: 'jandals', name: 'Jandals', caption: 'Jandals: what New Zealanders call flip-flops, perfect for the beach', story:
      "Jandals is the New Zealand word for flip-flops. The name is often said to come from \"Japanese sandals\", a style that became popular in the 1950s. Tātahi means beach, a word from Places and travel, and the beach is where many New Zealanders wear their jandals.",
    afterUnit: 2 },
  { id: 'silver-fern', name: 'Silver fern', caption: 'Silver fern (ponga): the undersides of its fronds are silver and catch the moonlight', story:
      "The silver fern, or ponga, has fronds that are silver-white underneath. It is often said that travellers turned the fronds over so the pale undersides would catch the moonlight and show the trail at night. Today the silver fern is a well-known symbol of New Zealand.",
    afterUnit: 3 },
  { id: 'pohutukawa', name: 'Pōhutukawa', caption: 'Pōhutukawa: the coastal tree with red flowers that bloom around Christmas', story:
      "The pōhutukawa is a coastal tree with bright red flowers that bloom in early summer, around Christmas, so it is often called the New Zealand Christmas tree. It grows on cliffs and beaches in the north of the country. Whero means red, a word from Nature and colours.",
    afterUnit: 4 },
  { id: 'gumboot', name: 'Gumboot', caption: 'Gumboot: the rubber boot every farm and garden needs', story:
      "Gumboots are tall rubber boots for mud, rain and farm work. The town of Taihape is known as the gumboot capital of the world. Hū means shoe, a word from Clothes and things.",
    afterUnit: 5 },
  { id: 'pavlova', name: 'Pavlova', caption: 'Pavlova: a meringue dessert with cream and fruit, a summer favourite', story:
      "Pavlova is a crisp meringue dessert with a soft middle, topped with cream and fruit. It is named after the Russian ballet dancer Anna Pavlova, who toured New Zealand and Australia in the 1920s. Both countries claim to have invented it, and the argument is still going.",
    afterUnit: 6 },
  { id: 'fish-and-chips', name: 'Fish and chips', caption: 'Fish and chips: a classic takeaway to eat by the beach', story:
      "Fish and chips is a classic New Zealand takeaway, often eaten from paper by the beach. The tradition came from Britain with settlers. Ika means fish, a word from Animals.",
    afterUnit: 7 },
  { id: 'hokey-pokey', name: 'Hokey pokey ice cream', caption: 'Hokey pokey: vanilla ice cream with crunchy toffee pieces', story:
      "Hokey pokey ice cream is vanilla ice cream with crunchy pieces of honeycomb toffee. It is a much-loved New Zealand flavour and a classic summer treat. The toffee is also called hokey pokey.",
    afterUnit: 8 },
  { id: 'tui', name: 'Tūī', caption: 'Tūī: a forest bird with a white tuft at its throat and a beautiful song', story:
      "The tūī is a native bird with a glossy dark body, a white tuft at its throat and a song of bell-like notes and clicks. It feeds on nectar from native flowers, which helps to pollinate them. Tūī is also a word from Animals.",
    afterUnit: 9 },
  { id: 'pukeko', name: 'Pūkeko', caption: 'Pūkeko: a blue swamp bird with a red beak and long legs, often seen in paddocks', story:
      "Pūkeko are blue-purple swamp birds with red beaks and long red legs. You often see them walking through paddocks and beside wetlands. They are related to the takahē, another New Zealand bird with a red beak. Pūkeko is a word from Animals.",
    afterUnit: 10 },
  { id: 'kumara', name: 'Kūmara', caption: 'Kūmara: the sweet potato brought to New Zealand by early Māori voyagers', story:
      "The kūmara, or sweet potato, was brought to New Zealand by Polynesian voyagers and became a vital crop for Māori. It was stored carefully over winter in pits. Kūmara is a word from Food and drink.",
    afterUnit: 11 },
  { id: 'kowhai', name: 'Kōwhai', caption: 'Kōwhai: a native tree with golden flowers in spring that tūī love', story:
      "The kōwhai is a native tree that bursts into golden-yellow flowers in spring, and tūī love its nectar. Kōwhai is also the Māori word for the colour yellow, a word from Nature and colours.",
    afterUnit: 12 },
  { id: 'weta', name: 'Wētā', caption: 'Wētā: a big, gentle native insect, a bit like a cricket with long feelers', story:
      "Wētā are large, gentle native insects, related to crickets, that come out at night. The giant wētā is one of the heaviest insects in the world. In Māori tradition the wētā punga is named after Punga, an ancestor of many creatures.",
    afterUnit: 13 },
  { id: 'tuatara', name: 'Tuatara', caption: 'Tuatara: a reptile found only in New Zealand, from a family as old as the dinosaurs', story:
      "The tuatara is a reptile that lives only in New Zealand. It looks like a lizard but belongs to a very old group that goes back to the age of the dinosaurs, so it is often called a living fossil. It is a taonga species, treasured by Māori, and its name is often explained as \"peaks on the back\".",
    afterUnit: 14 },
  { id: 'kereru', name: 'Kererū', caption: 'Kererū: the large native wood pigeon with a white chest and noisy wings', story:
      "The kereru is a large native wood pigeon with a green-bronze back and a white chest. It swallows big native fruits whole and spreads their seeds far and wide, which helps native forest grow. Ngahere means forest, a word from Places and travel.",
    afterUnit: 15 },
  { id: 'piwakawaka', name: 'Pīwakawaka', caption: 'Pīwakawaka (fantail): a tiny bird that flits about with its tail spread like a fan', story:
      "The pīwakawaka, or fantail, is a small friendly bird that flits about and fans out its tail. It often follows people through the bush to catch the insects they disturb. In a well-known story, Māui's quest to defeat death ended when a pīwakawaka's laughter woke Hine-nui-te-pō.",
    afterUnit: 16 },
  { id: 'feijoa', name: 'Feijoa', caption: 'Feijoa: a green fruit with sweet, gritty flesh that ripens in autumn', story:
      "The feijoa is a green fruit with sweet, slightly gritty flesh and a strong perfumed smell. The trees come from South America, and the fruit ripens in autumn. It is a popular backyard fruit in New Zealand, and people often share bags of them with neighbours.",
    afterUnit: 17 },
  { id: 'chilly-bin', name: 'Chilly bin', caption: 'Chilly bin: the insulated box that keeps food and drinks cold on the way to the beach', story:
      "A chilly bin is an insulated box that keeps food and drinks cold. It is the New Zealand word for what people in other countries call a cooler or an esky. It is packed for picnics, camping trips and days at the beach.",
    afterUnit: 18 },
  { id: 'number-8-wire', name: 'Number 8 wire', caption: 'Number 8 wire: fencing wire Kiwis use to fix almost anything', story:
      "Number 8 wire is thick fencing wire that farmers have used to make and mend all kinds of things. In New Zealand it has become a saying: number 8 wire thinking means fixing a problem cleverly with whatever you have. Many people see it as part of the Kiwi spirit.",
    afterUnit: 19 },
  { id: 'golden-kiwi', name: 'Golden kiwi', caption: 'Golden kiwi: you found them all! The kiwi is the bird that lives only in New Zealand', story:
      "The kiwi is a flightless bird that comes out at night and lives only in New Zealand. Its feathers were traditionally woven into prized cloaks called kahu kiwi. New Zealanders are nicknamed Kiwis too, and you have collected every treasure. Ka rawe!",
    afterUnit: 22 },
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

// ---- collector rank --------------------------------------------------------------

export interface Rank {
  name: string;
  /** Treasures needed to hold this rank. */
  min: number;
}

export const RANKS: readonly Rank[] = [
  { name: 'Ready to start', min: 0 },
  { name: 'Kiwiana rookie', min: 1 },
  { name: 'Explorer', min: 5 },
  { name: 'Collector', min: 10 },
  { name: 'Treasure hunter', min: 15 },
  { name: 'Kiwiana legend', min: 20 },
];

/** The collector rank for a number of treasures collected. */
export function rankFor(count: number): Rank {
  return [...RANKS].reverse().find((r) => count >= r.min) ?? RANKS[0];
}

/** The next rank up and how many more treasures it needs, or undefined at the top. */
export function nextRank(count: number): { rank: Rank; needed: number } | undefined {
  const rank = RANKS.find((r) => r.min > count);
  return rank ? { rank, needed: rank.min - count } : undefined;
}

/** The new rank when going from `before` to `after` treasures crosses a threshold, otherwise undefined. */
export function rankUp(before: number, after: number): Rank | undefined {
  const was = rankFor(before);
  const now = rankFor(after);
  return now.min > was.min ? now : undefined;
}

// ---- progress towards the next treasure ----------------------------------------------

export interface NextTreasureProgress {
  slot: TreasureSlot;
  learned: number;
  total: number;
  /** Every item of the unit is learned, so only the Kiwiz is left. */
  ready: boolean;
}

/** How far the learner is from unlocking the next treasure (the unit it follows, by items learned). */
export function nextTreasureProgress(
  slots: readonly TreasureSlot[],
  statuses: ReadonlyMap<string, UnitStatus>,
): NextTreasureProgress | undefined {
  const slot = nextTreasure(slots, statuses);
  if (!slot) return undefined;
  const status = statuses.get(slot.unit.id);
  const total = status?.itemsTotal ?? slot.unit.itemIds.length;
  const learned = Math.min(status?.itemsLearned ?? 0, total);
  return { slot, learned, total, ready: total > 0 && learned >= total };
}

// ---- recently unlocked ------------------------------------------------------------------

export interface RecentTreasure {
  slot: TreasureSlot;
  /** When the unit that unlocked it was completed, when known. */
  date: string | null;
}

/**
 * The most recently unlocked treasures, newest first. Treasures whose unit has no
 * completion date (for example Beginner units completed in the first release) come
 * after the dated ones, latest in the collection first.
 */
export function recentTreasures(
  slots: readonly TreasureSlot[],
  statuses: ReadonlyMap<string, UnitStatus>,
  completedAt: ReadonlyMap<string, string | null>,
  limit = 3,
): RecentTreasure[] {
  const got = unlockedTreasureIds(slots, statuses);
  return slots
    .map((slot, index) => ({ slot, index, date: completedAt.get(slot.unit.id) ?? null }))
    .filter((r) => got.has(r.slot.treasure.id))
    .sort((a, b) => {
      if (a.date && b.date) return b.date.localeCompare(a.date) || b.index - a.index;
      if (a.date) return -1;
      if (b.date) return 1;
      return b.index - a.index;
    })
    .slice(0, limit)
    .map(({ slot, date }) => ({ slot, date }));
}
