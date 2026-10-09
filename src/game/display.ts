/**
 * Upper-case the first letter of a sentence for display. Tiles are stored in
 * lower case, and marking always uses the stored tiles, never this text.
 */
export function capitaliseFirst(text: string): string {
  if (text === '') return text;
  const first = text.charAt(0);
  return first.toLocaleUpperCase('mi') + text.slice(1);
}

/** A sentence made of tiles, ready to show: tiles joined by spaces, first letter capitalised. */
export function sentenceFromTiles(tiles: readonly string[]): string {
  return capitaliseFirst(tiles.join(' '));
}

const looseText = (s: string) =>
  s
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * The word-for-word meaning of a multi-word word item (such as kia ora, "be
 * healthy, be well"), when it differs from the English meaning shown for it.
 */
export function literalFor(item: { kind: string; en: readonly string[]; breakdown?: { literal?: string } }): string | undefined {
  if (item.kind !== 'word') return undefined;
  const literal = item.breakdown?.literal?.trim();
  if (!literal) return undefined;
  return looseText(literal) === looseText(item.en[0] ?? '') ? undefined : literal;
}
