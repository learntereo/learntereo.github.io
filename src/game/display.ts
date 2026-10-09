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
