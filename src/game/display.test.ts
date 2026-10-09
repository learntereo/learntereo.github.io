import { describe, expect, it } from 'vitest';
import { capitaliseFirst, sentenceFromTiles } from './display';

describe('capitaliseFirst', () => {
  it('upper-cases the first letter only', () => {
    expect(capitaliseFirst('kei te pai')).toBe('Kei te pai');
    expect(capitaliseFirst('Kei te pai')).toBe('Kei te pai');
    expect(capitaliseFirst('')).toBe('');
  });

  it('handles a macron first letter', () => {
    expect(capitaliseFirst('āpōpō ka haere')).toBe('Āpōpō ka haere');
    expect(capitaliseFirst('ōku waewae')).toBe('Ōku waewae');
  });
});

describe('sentenceFromTiles', () => {
  it('joins tiles and capitalises, leaving proper nouns alone', () => {
    expect(sentenceFromTiles(['ko', 'Mere', 'tōku', 'ingoa'])).toBe('Ko Mere tōku ingoa');
  });

  it('does not change the tiles', () => {
    const tiles = ['he', 'kurī'];
    sentenceFromTiles(tiles);
    expect(tiles).toEqual(['he', 'kurī']);
  });
});
