export type Level = 'beginner' | 'intermediate' | 'advanced';
export type Mode = 'match' | 'picture' | 'translate' | 'write' | 'gap' | 'order' | 'mixed';
/** A single question is never "mixed": Mixed rounds pick one of these per question. */
export type QuestionMode = Exclude<Mode, 'mixed'>;

/** Everything a stored round can be: a free-practice mode or a path round. */
export type RoundMode = Mode | 'unit_practice' | 'unit_check' | 'review';

export const LEVELS: readonly Level[] = ['beginner', 'intermediate', 'advanced'];
export const MODES: readonly Mode[] = ['match', 'picture', 'translate', 'write', 'gap', 'order', 'mixed'];
export const ROUND_MODES: readonly RoundMode[] = [...MODES, 'unit_practice', 'unit_check', 'review'];

export type ItemImage = { emoji: string } | { svg: string };

export interface WordItem {
  id: string;
  kind: 'word';
  level: Level;
  mi: string;
  en: string[];
  image?: ItemImage;
}

export interface SentenceItem {
  id: string;
  kind: 'sentence';
  level: Level;
  mi: string;
  en: string[];
  tiles: string[];
  altOrders?: string[][];
  decoys?: string[];
}

export type Item = WordItem | SentenceItem;

/** One unit of the learning path. Its items are defined in the same content file. */
export interface Unit {
  id: string;
  level: Level;
  order: number;
  /** English title. */
  title: string;
  /** Māori title. */
  titleMi: string;
  emoji: string;
  /** Words and sentences that belong to this unit. */
  itemIds: string[];
  /** Id of the grammar note file for this unit. */
  grammar: string;
}

/** Shape of each file in src/content/units. */
export interface UnitFile {
  unit: Unit;
  items: Item[];
}

/** How a question ended: drives XP (10 / 5 / 0). */
export type Result = 'first' | 'retry' | 'missed';

/** One question in a round. Boards (match, picture) cover several items. */
export interface Question {
  mode: QuestionMode;
  /** Match: 5 words. Picture: 4 words. Translate and Order: one item. */
  itemIds: string[];
  /** Order only: the decoy tiles chosen when the round was generated. */
  decoys?: string[];
  /** Fill the gap only: which tile is blanked. */
  gapIndex?: number;
  /** Fill the gap only: the answer and its distractors, shuffled when the round was generated. */
  options?: string[];
  /** True when this is the second, final attempt at a missed question. */
  requeued: boolean;
}

export interface ItemOutcome {
  itemId: string;
  correct: boolean;
  /**
   * How this item went on its own. Boards set it per word; for single-item
   * questions it is the question result and may be left out.
   */
  result?: Result;
}

/** The recorded result of one answered question. */
export interface Outcome {
  result: Result;
  requeued: boolean;
  items: ItemOutcome[];
}

export interface RoundState {
  version: 1;
  level: Level;
  mode: RoundMode;
  /** Set for unit practice and unit check rounds. */
  unitId?: string;
  /** Number of original questions (the score denominator). */
  originalCount: number;
  questions: Question[];
  /** Index of the question currently being answered. */
  index: number;
  outcomes: Outcome[];
  /** True once the missed questions have been appended for a second attempt. */
  requeued: boolean;
  /** Filled in when the round completes. */
  summary?: RoundSummary;
}

export interface RoundSummary {
  newlyLearned: number;
  /** Only set by PoC rounds; the path replaces this with unit completion. */
  unlockedIntermediate?: boolean;
  streak: number;
  /** Unit check rounds only. */
  unitCheck?: UnitCheckSummary;
  /** Ids of items answered wrong in the original questions (unit rounds). */
  missedItemIds?: string[];
}

export interface UnitCheckSummary {
  unitId: string;
  passed: boolean;
  /** True the first time this unit is completed. */
  firstCompletion: boolean;
  /** The unit this pass opened up, when there is one. */
  nextUnitId?: string;
}
