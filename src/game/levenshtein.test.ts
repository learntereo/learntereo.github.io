import { describe, expect, it } from 'vitest';
import { levenshtein } from './levenshtein';

describe('levenshtein', () => {
  it('is zero for equal strings', () => {
    expect(levenshtein('kurī', 'kurī')).toBe(0);
    expect(levenshtein('', '')).toBe(0);
  });

  it('measures against the empty string', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abcd', '')).toBe(4);
  });

  it('counts insert, delete and substitute as one edit each', () => {
    expect(levenshtein('dog', 'dogs')).toBe(1);
    expect(levenshtein('dogs', 'dog')).toBe(1);
    expect(levenshtein('dog', 'dig')).toBe(1);
  });

  it('counts an adjacent swap as one edit', () => {
    expect(levenshtein('dog', 'dgo')).toBe(1);
  });

  it('handles classic examples', () => {
    expect(levenshtein('kitten', 'sitting')).toBe(3);
    expect(levenshtein('flaw', 'lawn')).toBe(2);
  });

  it('is symmetric', () => {
    expect(levenshtein('house', 'mouse')).toBe(levenshtein('mouse', 'house'));
    expect(levenshtein('abc', 'xyzabc')).toBe(levenshtein('xyzabc', 'abc'));
  });
});
