import type { Level, SentenceItem } from './types';
import { shuffle, type Rng } from './rng';

const PUNCTUATION_ONLY = /^[\p{P}\p{S}]+$/u;

function stripTrailingPunctuation(tiles: readonly string[]): string[] {
  const out = [...tiles];
  while (out.length > 0 && PUNCTUATION_ONLY.test(out[out.length - 1])) out.pop();
  return out;
}

function sameSequence(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((tile, i) => tile === b[i]);
}

/** Exact, case- and macron-sensitive match against the tiles or any altOrder. */
export function checkOrder(answer: readonly string[], sentence: Pick<SentenceItem, 'tiles' | 'altOrders'>): boolean {
  const given = stripTrailingPunctuation(answer);
  if (given.length === 0) return false;
  const candidates = [sentence.tiles, ...(sentence.altOrders ?? [])];
  return candidates.some((candidate) => sameSequence(given, stripTrailingPunctuation(candidate)));
}

export function decoyCountForLevel(level: Level): number {
  return level === 'beginner' ? 1 : 2;
}

/**
 * Choose decoy tiles for a sentence: its own `decoys` first; if there are
 * fewer than needed, top up with tiles from other same-level sentences that
 * are not part of this sentence.
 */
export function pickDecoys(sentence: SentenceItem, sameLevelSentences: readonly SentenceItem[], rng: Rng): string[] {
  const needed = decoyCountForLevel(sentence.level);
  const own = [...new Set(sentence.decoys ?? [])].filter((d) => !sentence.tiles.includes(d));
  if (own.length >= needed) return shuffle(own, rng).slice(0, needed);

  const picked = [...own];
  const pool = new Set<string>();
  for (const other of sameLevelSentences) {
    if (other.id === sentence.id) continue;
    for (const tile of other.tiles) {
      if (!sentence.tiles.includes(tile) && !picked.includes(tile)) pool.add(tile);
    }
  }
  for (const tile of shuffle([...pool], rng)) {
    if (picked.length >= needed) break;
    picked.push(tile);
  }
  return picked;
}

export interface BankTile {
  /** Unique within the question, so repeated words such as "te" stay distinct. */
  id: string;
  text: string;
  decoy: boolean;
}

export function buildBank(tiles: readonly string[], decoys: readonly string[], rng: Rng): BankTile[] {
  const all: BankTile[] = [
    ...tiles.map((text, i) => ({ id: `t${i}`, text, decoy: false })),
    ...decoys.map((text, i) => ({ id: `d${i}`, text, decoy: true })),
  ];
  return shuffle(all, rng);
}
