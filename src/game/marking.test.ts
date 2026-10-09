import { describe, expect, it } from 'vitest';
import { isAnswerCorrect, normaliseAnswer } from './marking';

describe('normaliseAnswer', () => {
  it('lowercases', () => {
    expect(normaliseAnswer('DOG')).toBe('dog');
  });

  it('trims and collapses whitespace', () => {
    expect(normaliseAnswer('  big   dog  ')).toBe('big dog');
  });

  it('strips punctuation', () => {
    expect(normaliseAnswer('Hello, there! How are you?')).toBe('hello there how are you');
    expect(normaliseAnswer('"dog";:.')).toBe('dog');
  });

  it('removes apostrophes without splitting words', () => {
    expect(normaliseAnswer("I'm good")).toBe('im good');
    expect(normaliseAnswer('I’m good')).toBe('im good');
  });

  it('strips leading articles and a leading "to"', () => {
    expect(normaliseAnswer('The dog')).toBe('dog');
    expect(normaliseAnswer('a dog')).toBe('dog');
    expect(normaliseAnswer('An apple')).toBe('apple');
    expect(normaliseAnswer('to go')).toBe('go');
    expect(normaliseAnswer('to the sea')).toBe('sea');
  });

  it('does not strip articles that are not leading, or a lone article', () => {
    expect(normaliseAnswer('I am at the shop')).toBe('i am at the shop');
    expect(normaliseAnswer('the')).toBe('the');
  });

  it('normalises to NFC so decomposed macrons compare equal', () => {
    expect(normaliseAnswer('mā')).toBe(normaliseAnswer('mā'));
  });
});

describe('isAnswerCorrect', () => {
  const dog = ['dog'];

  it('accepts exact answers regardless of case, punctuation and articles (AC8)', () => {
    expect(isAnswerCorrect('The Dog!', dog)).toBe(true);
    expect(isAnswerCorrect('dog', dog)).toBe(true);
  });

  it('accepts a small typo (AC8)', () => {
    expect(isAnswerCorrect('dgo', dog)).toBe(true);
    expect(isAnswerCorrect('dogg', dog)).toBe(true);
  });

  it('accepts any entry in the accepted list', () => {
    const accepted = ['mum', 'mother', 'mom'];
    expect(isAnswerCorrect('Mother', accepted)).toBe(true);
    expect(isAnswerCorrect('mom', accepted)).toBe(true);
  });

  it('allows distance 1 for answers of 8 characters or fewer', () => {
    expect(isAnswerCorrect('mountian', ['mountain'])).toBe(true); // swap, 8 chars
    expect(isAnswerCorrect('mountaxx', ['mountain'])).toBe(false); // 2 edits, 8 chars
  });

  it('allows distance 2 for answers longer than 8 characters', () => {
    expect(isAnswerCorrect('elefhnat', ['elephant'])).toBe(false); // 8 chars, 2 edits
    expect(isAnswerCorrect('bycicle lane', ['bicycle lane'])).toBe(true); // 1 edit
    expect(isAnswerCorrect('i am gooing to scool', ['i am going to school'])).toBe(true); // 2 edits
    expect(isAnswerCorrect('i am gooing to scooool', ['i am going to school'])).toBe(false); // 3 edits
  });

  it('rejects clearly wrong answers', () => {
    expect(isAnswerCorrect('cat', dog)).toBe(false);
    expect(isAnswerCorrect('elephant', dog)).toBe(false);
    expect(isAnswerCorrect('', dog)).toBe(false);
    expect(isAnswerCorrect('   ', dog)).toBe(false);
  });

  it('does not apply typo tolerance to numerals', () => {
    expect(isAnswerCorrect('2', ['one', '1'])).toBe(false);
    expect(isAnswerCorrect('1', ['one', '1'])).toBe(true);
  });

  it('compares typos on the normalised form, not the raw form', () => {
    expect(isAnswerCorrect('  THE   Dgo?? ', dog)).toBe(true);
  });
});
