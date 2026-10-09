import { describe, expect, it } from 'vitest';
import { insertAtCursor, isWriteCorrect, markWrite, markWriteItem, normaliseMaori, stripMacrons, writeNote } from './macronMarking';

describe('stripMacrons', () => {
  it('replaces every macron vowel, in both cases', () => {
    expect(stripMacrons('kurī')).toBe('kuri');
    expect(stripMacrons('Māori ĀĒĪŌŪ āēīōū')).toBe('Maori AEIOU aeiou');
  });

  it('handles a combining macron', () => {
    expect(stripMacrons('kurī')).toBe('kuri');
  });
});

describe('normaliseMaori', () => {
  it('lowercases, drops punctuation and collapses spaces but keeps macrons', () => {
    expect(normaliseMaori('  Kei  te PĀI, ahau! ')).toBe('kei te pāi ahau');
  });
});

describe('markWrite (AC6)', () => {
  it('accepts the exact answer', () => {
    expect(markWrite('kurī', 'kurī')).toEqual({ kind: 'exact' });
    expect(markWrite(' Kurī. ', 'kurī')).toEqual({ kind: 'exact' });
  });

  it('accepts a missing macron and asks the learner to watch it', () => {
    const verdict = markWrite('kuri', 'kurī');
    expect(verdict).toEqual({ kind: 'macron' });
    expect(isWriteCorrect(verdict)).toBe(true);
    expect(writeNote(verdict, 'kurī')).toBe('Correct, watch the macron: kurī');
  });

  it('accepts a macron put on the wrong vowel as a macron slip', () => {
    expect(markWrite('kūri', 'kurī').kind).toBe('macron');
  });

  it('works for whole sentences', () => {
    expect(markWrite('Kei te pehea koe', 'Kei te pēhea koe').kind).toBe('macron');
    expect(markWrite('kei te pēhea koe?', 'Kei te pēhea koe')).toEqual({ kind: 'exact' });
  });

  it('forgives a small typo only in longer answers', () => {
    expect(markWrite('whakarongu', 'whakarongo').kind).toBe('typo');
    expect(writeNote({ kind: 'typo' }, 'whakarongo')).toBe('Correct, watch the spelling: whakarongo');
  });

  it('never forgives a typo in a short word', () => {
    expect(markWrite('rau', 'rua').kind).toBe('wrong');
    expect(markWrite('tahu', 'tahi').kind).toBe('wrong');
    expect(markWrite('kau', 'kai').kind).toBe('wrong');
  });

  it('rejects a different word and empty input', () => {
    expect(markWrite('ngeru', 'kurī')).toEqual({ kind: 'wrong' });
    expect(markWrite('', 'kurī')).toEqual({ kind: 'wrong' });
    expect(markWrite('   ', 'kurī')).toEqual({ kind: 'wrong' });
    expect(isWriteCorrect({ kind: 'wrong' })).toBe(false);
  });

  it('gives no note for an exact answer', () => {
    expect(writeNote({ kind: 'exact' }, 'kurī')).toBeNull();
  });
});

describe('insertAtCursor (AC7)', () => {
  it('inserts at the cursor', () => {
    expect(insertAtCursor('kuri', 4, 4, 'ī')).toEqual({ value: 'kuriī', cursor: 5 });
    expect(insertAtCursor('mama', 1, 1, 'ā')).toEqual({ value: 'māama', cursor: 2 });
  });

  it('replaces a selection', () => {
    expect(insertAtCursor('mama', 1, 2, 'ā')).toEqual({ value: 'māma', cursor: 2 });
  });

  it('appends when there is no selection info', () => {
    expect(insertAtCursor('ma', null, null, 'ā')).toEqual({ value: 'maā', cursor: 3 });
  });
});

describe('markWriteItem with alternatives', () => {
  const hia = { mi: 'e hia', miAlt: ['hia'] };
  const two = { mi: 'rua', miAlt: ['e rua'] };

  it('accepts both "e hia" and "hia" for how many, and shows the canonical form for the alternative', () => {
    expect(markWriteItem('e hia', hia).kind).toBe('exact');
    expect(markWriteItem('E hia', hia).kind).toBe('exact');
    const alt = markWriteItem('hia', hia);
    expect(alt.kind).toBe('alt');
    expect(isWriteCorrect(alt)).toBe(true);
    expect(writeNote(alt, hia.mi)).toBe('Correct. It is usually written: e hia');
  });

  it('accepts "e rua" for two as well as "rua"', () => {
    expect(markWriteItem('rua', two).kind).toBe('exact');
    expect(isWriteCorrect(markWriteItem('e rua', two))).toBe(true);
  });

  it('applies the macron rule to alternatives', () => {
    expect(isWriteCorrect(markWriteItem('e wha', { mi: 'whā', miAlt: ['e whā'] }))).toBe(true);
    expect(isWriteCorrect(markWriteItem('E whā', { mi: 'whā', miAlt: ['e whā'] }))).toBe(true);
  });

  it('still rejects a wrong alternative or a different number', () => {
    expect(isWriteCorrect(markWriteItem('e toru', two))).toBe(false);
    expect(isWriteCorrect(markWriteItem('toru', two))).toBe(false);
    expect(isWriteCorrect(markWriteItem('e aha', hia))).toBe(false);
    expect(isWriteCorrect(markWriteItem('', hia))).toBe(false);
  });

  it('behaves like markWrite when there are no alternatives', () => {
    expect(markWriteItem('kuri', { mi: 'kurī' }).kind).toBe('macron');
    expect(markWriteItem('poaka', { mi: 'kurī' }).kind).toBe('wrong');
  });
});
