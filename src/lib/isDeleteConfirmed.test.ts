import { describe, expect, it } from 'vitest';
import { isDeleteConfirmed } from './isDeleteConfirmed';

describe('isDeleteConfirmed', () => {
  it('accepts an exact match', () => {
    expect(isDeleteConfirmed('DELETE')).toBe(true);
  });

  it('accepts surrounding whitespace', () => {
    expect(isDeleteConfirmed('  DELETE  ')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isDeleteConfirmed('delete')).toBe(false);
    expect(isDeleteConfirmed('')).toBe(false);
    expect(isDeleteConfirmed('DELETE ME')).toBe(false);
  });
});
