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
    expect(normaliseAnswer("I'm good")).toBe('i am good');
    expect(normaliseAnswer('I’m good')).toBe('i am good');
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

describe('number words and digits', () => {
  it('treats digits and number words as the same answer', () => {
    expect(isAnswerCorrect('there are 10 fish', ['There are ten fish'])).toBe(true);
    expect(isAnswerCorrect('There are ten fish', ['there are 10 fish'])).toBe(true);
    expect(isAnswerCorrect('21 children', ['twenty-one children'])).toBe(true);
    expect(isAnswerCorrect('twenty one children', ['21 children'])).toBe(true);
    expect(isAnswerCorrect('a hundred birds', ['100 birds'])).toBe(true);
    expect(isAnswerCorrect('100 birds', ['one hundred birds'])).toBe(true);
    expect(isAnswerCorrect('1000', ['one thousand'])).toBe(true);
    expect(isAnswerCorrect('a thousand', ['1000'])).toBe(true);
    expect(isAnswerCorrect('15', ['fifteen'])).toBe(true);
    expect(isAnswerCorrect('0', ['zero'])).toBe(true);
  });

  it('converts compounds and combinations', () => {
    const n = (text: string) => normaliseAnswer(text);
    expect(n('twenty-one')).toBe('21');
    expect(n('ninety nine')).toBe('99');
    expect(n('one hundred and five')).toBe('105');
    expect(n('two hundred and fifty')).toBe('250');
    expect(n('a hundred')).toBe('100');
    expect(n('three thousand four hundred and twelve')).toBe('3412');
    expect(n('eleven')).toBe('11');
    expect(n('forty')).toBe('40');
  });

  it('keeps separate numbers separate', () => {
    expect(normaliseAnswer('five six')).toBe('5 6');
    expect(normaliseAnswer('ten ten')).toBe('10 10');
    expect(normaliseAnswer('twenty twenty')).toBe('20 20');
  });

  it('keeps digits exact: a different number never passes', () => {
    expect(isAnswerCorrect('there are 9 fish', ['there are ten fish'])).toBe(false);
    expect(isAnswerCorrect('2', ['1'])).toBe(false);
    expect(isAnswerCorrect('11', ['1'])).toBe(false);
    expect(isAnswerCorrect('1', ['11'])).toBe(false);
    expect(isAnswerCorrect('twenty', ['21'])).toBe(false);
    expect(isAnswerCorrect('eleven', ['1'])).toBe(false);
    expect(isAnswerCorrect('twenty', ['two'])).toBe(false);
  });

  it('still forgives a typo in the other words when the numbers match', () => {
    expect(isAnswerCorrect('there are 10 fsh', ['There are ten fish'])).toBe(true);
  });

  it('leaves words that only contain a number word alone', () => {
    expect(normaliseAnswer('someone')).toBe('someone');
    expect(normaliseAnswer('tension')).toBe('tension');
    expect(normaliseAnswer('the weight')).toBe('weight');
  });

  it('accepts the course answers for the big numbers', () => {
    expect(isAnswerCorrect('11', ['eleven'])).toBe(true);
    expect(isAnswerCorrect('50', ['fifty'])).toBe(true);
    expect(isAnswerCorrect('1000', ['one thousand', 'a thousand'])).toBe(true);
    expect(isAnswerCorrect('There are 15 children', ['There are fifteen children', 'Fifteen children'])).toBe(true);
  });
});

describe('NZ spelling', () => {
  it('accepts US spellings for NZ answers', () => {
    expect(isAnswerCorrect('my favorite color', ['my favourite colour'])).toBe(true);
    expect(isAnswerCorrect('That is my mom', ['That is my mum'])).toBe(true);
    expect(isAnswerCorrect('gray', ['grey'])).toBe(true);
    expect(isAnswerCorrect('airplane', ['aeroplane'])).toBe(true);
  });
  it('still rejects a different word', () => {
    expect(isAnswerCorrect('my favourite food', ['my favourite colour'])).toBe(false);
  });
});

describe('contractions', () => {
  const same = (a: string, b: string) => expect(normaliseAnswer(a)).toBe(normaliseAnswer(b));

  it('expands contractions on the input so they match the full form', () => {
    same("That's a green tree", 'That is a green tree');
    same("It's cold", 'It is cold');
    same("I'm happy", 'I am happy');
    same("You're well", 'You are well');
    same("We're going", 'We are going');
    same("They're children", 'They are children');
    same("He's eating", 'He is eating');
    same("She's eating", 'She is eating');
    same("There's a dog", 'There is a dog');
    same("What's this", 'What is this');
    same("Where's the bus", 'Where is the bus');
    same("Who's that", 'Who is that');
    same("Isn't it", 'Is not it');
    same("They aren't here", 'They are not here');
    same("Don't talk", 'Do not talk');
    same("Doesn't work", 'Does not work');
    same("Didn't go", 'Did not go');
    same("Won't go", 'Will not go');
    same("Can't go", 'Cannot go');
    same("Can't go", 'Can not go');
    same("I'll go", 'I will go');
    same("We'll go", 'We will go');
    same("You'll go", 'You will go');
    same("I've eaten", 'I have eaten');
    same("Let's go", 'Let us go');
  });

  it('expands them on the accepted answers too, and handles curly apostrophes', () => {
    expect(isAnswerCorrect('That is a green tree', ["That's a green tree"])).toBe(true);
    expect(isAnswerCorrect('That’s a green tree', ['That is a green tree'])).toBe(true);
    expect(isAnswerCorrect("don't run", ['Do not run'])).toBe(true);
  });

  it('handles the unambiguous forms typed without an apostrophe', () => {
    same('thats a green tree', 'that is a green tree');
    same('im happy', 'i am happy');
    same('youre well', 'you are well');
    same('theyre children', 'they are children');
    same('dont run', 'do not run');
    same('doesnt work', 'does not work');
    same('isnt cold', 'is not cold');
    same('cant go', 'cannot go');
  });

  it('leaves real words and possessives alone', () => {
    expect(normaliseAnswer('its tail')).toBe('its tail');
    expect(normaliseAnswer('wont')).toBe('wont');
    expect(normaliseAnswer("my mum's dog")).toBe('my mums dog');
  });

  it('does not let a contraction turn a wrong answer right', () => {
    expect(isAnswerCorrect("That's a green tree", ['That is a blue house'])).toBe(false);
    expect(isAnswerCorrect("I'm happy", ['You are happy'])).toBe(false);
  });
});
