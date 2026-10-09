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
  { id: "paua", name: "Pāua", caption: "Pāua: the shell that shimmers blue, green and purple", story:
      "Every bach windowsill seems to have a pāua shell on it. Māori carvers have long set pāua into carvings as shining eyes, and the meat has always been prized kai, gathered by hand from our rocky coasts.",
    afterUnit: 1 },
  { id: "jandals", name: "Jandals", caption: "Jandals: summer footwear, sorted", story:
      "Jandals have been our summer footwear since the 1950s. The name is often said to come from \"Japanese sandals\". Tātahi means beach, a word from Places and travel, and that's where most jandals end up.",
    afterUnit: 2 },
  { id: "silver-fern", name: "Silver fern", caption: "Silver fern (ponga): silver underneath, made to catch the moonlight", story:
      "Turn a ponga frond over and the underside is silver-white. It's often said hunters and travellers laid fronds silver-side up to catch the moonlight and mark the track home at night. Now you'll see it on the black jersey.",
    afterUnit: 3 },
  { id: "pohutukawa", name: "Pōhutukawa", caption: "Pōhutukawa: red flowers that mean summer is here", story:
      "When the pōhutukawa flowers red along the coast, you know Christmas and summer are close. In Māori tradition, an old pōhutukawa at Te Rerenga Wairua is where spirits leave the land. Whero means red, a word from Nature and colours.",
    afterUnit: 4 },
  { id: "gumboot", name: "Gumboot", caption: "Gumboot: farm, garden, festival, sorted", story:
      "Gumboots get us through mud, rain and the farm. Taihape calls itself the gumboot capital of the world, and Fred Dagg sang about them. Hū means shoe, a word from Clothes and things.",
    afterUnit: 5 },
  { id: "pavlova", name: "Pavlova", caption: "Pavlova: crisp outside, soft inside, cream and fruit on top", story:
      "No summer gathering is complete without a pav. It's named after the ballet dancer Anna Pavlova, who toured here in the 1920s. The Aussies reckon they invented it, and we're not letting that go.",
    afterUnit: 6 },
  { id: "fish-and-chips", name: "Fish and chips", caption: "Fish and chips: wrapped in paper, eaten at the beach", story:
      "Friday night fish and chips, wrapped in paper and eaten by the water, is hard to beat. Ika means fish, a word from Animals.",
    afterUnit: 7 },
  { id: "hokey-pokey", name: "Hokey pokey ice cream", caption: "Hokey pokey: vanilla with crunchy honeycomb toffee", story:
      "Hokey pokey is our own ice cream flavour: vanilla packed with crunchy honeycomb toffee. Ask for a double scoop at the dairy.",
    afterUnit: 8 },
  { id: "tui", name: "Tūī", caption: "Tūī: the bird with the white tuft and the best song in the bush", story:
      "You hear a tūī before you see one: bell notes, clicks and wheezes all mixed together. They feed on nectar and help pollinate native trees like kōwhai and flax. Tūī is a word from Animals.",
    afterUnit: 9 },
  { id: "pukeko", name: "Pūkeko", caption: "Pūkeko: blue feathers, red beak, big feet", story:
      "You'll spot pūkeko stalking across paddocks and roadside swamps, flicking their white tails. They're cousins of the much rarer takahē. Pūkeko is a word from Animals.",
    afterUnit: 10 },
  { id: "kumara", name: "Kūmara", caption: "Kūmara: the crop that came with the waka", story:
      "Kūmara came here with Polynesian voyagers and became one of the most important Māori crops, stored over winter in underground pits. Kūmara is a word from Food and drink.",
    afterUnit: 11 },
  { id: "kowhai", name: "Kōwhai", caption: "Kōwhai: golden flowers in spring, loved by tūī", story:
      "In spring, kōwhai trees burst into golden flowers and the tūī move in for the nectar. Kōwhai is also the word for yellow, a word from Nature and colours.",
    afterUnit: 12 },
  { id: "weta", name: "Wētā", caption: "Wētā: big, spiky and harmless (mostly)", story:
      "Wētā have been here since long before people. The giant wētā is one of the heaviest insects in the world. In Māori tradition the wētā punga is named after Punga, an ancestor of many creatures.",
    afterUnit: 13 },
  { id: "tuatara", name: "Tuatara", caption: "Tuatara: the last of a line older than the dinosaurs", story:
      "Tuatara look like lizards, but they're the last survivors of a group that goes back to the age of the dinosaurs. They're a taonga species, and the name is often explained as \"peaks on the back\".",
    afterUnit: 14 },
  { id: "kereru", name: "Kererū", caption: "Kererū: the wood pigeon with the noisy wings", story:
      "You hear a kererū's heavy wingbeats before you see it. It swallows big native fruit whole and spreads the seeds, which keeps our forests growing. Ngahere means forest, a word from Places and travel.",
    afterUnit: 15 },
  { id: "piwakawaka", name: "Pīwakawaka", caption: "Pīwakawaka (fantail): your cheeky walking companion", story:
      "Go for a bush walk and a pīwakawaka will follow you, snapping up the insects you disturb. In a well-known story, Māui's quest to defeat death ended when a pīwakawaka's laughter woke Hine-nui-te-pō.",
    afterUnit: 16 },
  { id: "feijoa", name: "Feijoa", caption: "Feijoa: autumn means bags of them from the neighbours", story:
      "Come autumn, everyone's trying to give away bags of feijoas. The trees came from South America, but the fruit feels like ours now.",
    afterUnit: 17 },
  { id: "chilly-bin", name: "Chilly bin", caption: "Chilly bin: packed for every beach day", story:
      "No beach day, camping trip or barbecue is complete without the chilly bin. The name is a Kiwi original, and it has stuck for decades.",
    afterUnit: 18 },
  { id: "number-8-wire", name: "Number 8 wire", caption: "Number 8 wire: fix anything with what you have", story:
      "Farmers used number 8 fencing wire to make and mend just about anything. Number 8 wire thinking is our way of saying you can solve a problem with whatever is lying around.",
    afterUnit: 19 },
  { id: "golden-kiwi", name: "Golden kiwi", caption: "Golden kiwi: you found them all!", story:
      "The kiwi only lives here: a flightless night bird, and a taonga. Its feathers were woven into prized cloaks called kahu kiwi. It's our national bird and our nickname, and now it's yours too. Ka rawe!",
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
