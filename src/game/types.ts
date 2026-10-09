export type Level = 'beginner' | 'intermediate';
export type Mode = 'match' | 'translate' | 'order' | 'picture' | 'mixed';
/** A single question is never "mixed": Mixed rounds pick one of these per question. */
export type QuestionMode = Exclude<Mode, 'mixed'>;

export const LEVELS: readonly Level[] = ['beginner', 'intermediate'];
export const MODES: readonly Mode[] = ['match', 'translate', 'order', 'picture', 'mixed'];

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

export interface Content {
  version: number;
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
  /** True when this is the second, final attempt at a missed question. */
  requeued: boolean;
}

export interface ItemOutcome {
  itemId: string;
  correct: boolean;
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
  mode: Mode;
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
  unlockedIntermediate: boolean;
  streak: number;
}
