import { levenshtein } from './levenshtein';

const LEADING_WORDS = new Set(['a', 'an', 'the', 'to']);

const UNITS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
};
const TENS: Record<string, number> = {
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
};

const isUnit = (w: string | undefined): w is string => w !== undefined && w in UNITS;
const isTens = (w: string | undefined): w is string => w !== undefined && w in TENS;
const isScale = (w: string | undefined) => w === 'hundred' || w === 'thousand';
const isNumberWord = (w: string | undefined) => isUnit(w) || isTens(w) || isScale(w);

/**
 * Replace English number words with digits ("twenty one" becomes "21", "a hundred"
 * becomes "100"), so "10" and "ten" compare equal. Takes words that are already
 * lowercased and split. Each run of number words that forms one number becomes one
 * token; "five six" stays two numbers.
 */
export function numberWordsToDigits(words: readonly string[]): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < words.length) {
    const startsNumber = isNumberWord(words[i]) || (words[i] === 'a' && isScale(words[i + 1]));
    if (!startsNumber) {
      out.push(words[i]);
      i += 1;
      continue;
    }

    let thousands = 0; // already multiplied
    let hundreds = 0; // already multiplied
    let below = 0; // 0 to 99
    let hasBelow = false;
    let started = false;
    while (i < words.length) {
      const w = words[i];
      const next = words[i + 1];
      if (w === 'a' && !started && isScale(next)) {
        below = 1;
        hasBelow = true;
        started = true;
      } else if (isUnit(w)) {
        // A unit joins "twenty" to "twenty one", or follows "hundred" and the like; otherwise it is a new number.
        const joinsTens = hasBelow && below >= 20 && below % 10 === 0 && UNITS[w] < 10;
        if (hasBelow && !joinsTens) break;
        below += UNITS[w];
        hasBelow = true;
        started = true;
      } else if (isTens(w)) {
        if (hasBelow) break;
        below = TENS[w];
        hasBelow = true;
        started = true;
      } else if (w === 'hundred') {
        if (hundreds > 0 || (hasBelow && (below < 1 || below > 9))) break;
        hundreds = (hasBelow ? below : 1) * 100;
        below = 0;
        hasBelow = false;
        started = true;
      } else if (w === 'thousand') {
        if (thousands > 0 || hundreds > 0 || (hasBelow && below < 1)) break;
        thousands = (hasBelow ? below : 1) * 1000;
        below = 0;
        hasBelow = false;
        started = true;
      } else if (w === 'and' && (hundreds > 0 || thousands > 0) && !hasBelow && (isUnit(next) || isTens(next))) {
        // "one hundred and five": the "and" belongs to the number
      } else {
        break;
      }
      i += 1;
    }
    out.push(String(thousands + hundreds + below));
  }
  return out;
}

/** Stripped contractions that are unambiguous (`its` and `wont` are real words, so they are left alone). */
const STRIPPED_CONTRACTIONS: Record<string, string> = {
  thats: 'that is',
  im: 'i am',
  youre: 'you are',
  theyre: 'they are',
  dont: 'do not',
  doesnt: 'does not',
  isnt: 'is not',
  cant: 'cannot',
};

/**
 * Expand contractions ("that's" becomes "that is", "don't" becomes "do not") in lowercase text
 * that still has its apostrophes. Possessives such as "mum's" are left as they are.
 */
export function expandContractions(text: string): string {
  const word = String.fromCharCode(92) + 'b';
  const w = (source: string) => new RegExp(source.replace(/<b>/g, word), 'g');
  return text
    .replace(/[‘’`]/g, "'")
    .replace(w("<b>can't<b>"), 'cannot')
    .replace(w("<b>won't<b>"), 'will not')
    .replace(w("<b>let's<b>"), 'let us')
    .replace(w("<b>([a-z]+)n't<b>"), '$1 not')
    .replace(w("<b>i'm<b>"), 'i am')
    .replace(w("<b>([a-z]+)'re<b>"), '$1 are')
    .replace(w("<b>([a-z]+)'ll<b>"), '$1 will')
    .replace(w("<b>([a-z]+)'ve<b>"), '$1 have')
    .replace(w("<b>(that|it|he|she|there|what|where|who|here|how|when)'s<b>"), '$1 is');
}

/**
 * Lowercase, NFC, strip punctuation, collapse whitespace and drop leading
 * "a / an / the / to" so "The Dog!" and "dog" compare equal. English number words
 * become digits, so "ten" and "10" compare equal. Meant for English answers only.
 */
/** US spellings and words a learner might type, mapped to the NZ forms the course uses. */
const US_TO_NZ: Readonly<Record<string, string>> = {
  color: 'colour', colors: 'colours', colored: 'coloured', favorite: 'favourite', favorites: 'favourites',
  gray: 'grey', mom: 'mum', moms: 'mums', mommy: 'mum', airplane: 'aeroplane', airplanes: 'aeroplanes',
  center: 'centre', centers: 'centres', neighbor: 'neighbour', neighbors: 'neighbours', flavor: 'flavour',
  flavors: 'flavours', honor: 'honour', humor: 'humour', behavior: 'behaviour', traveled: 'travelled',
  traveling: 'travelling', traveler: 'traveller', theater: 'theatre', meter: 'metre', meters: 'metres',
  organize: 'organise', organized: 'organised', realize: 'realise', recognize: 'recognise', practicing: 'practising',
  pajamas: 'pyjamas', jewelry: 'jewellery', tire: 'tyre', tires: 'tyres', cozy: 'cosy',
};

export function normaliseAnswer(input: string): string {
  const cleaned = expandContractions(input.normalize('NFC').toLowerCase())
    .replace(/['‘’`"“”]/g, '')
    .replace(/[\p{P}\p{S}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned === '') return '';
  const words = cleaned
    .split(' ')
    .flatMap((word) => (STRIPPED_CONTRACTIONS[word] ?? word).split(' '))
    .map((word) => US_TO_NZ[word] ?? word);
  const parts = numberWordsToDigits(words.join(' ').replace(/ can not /g, ' cannot ').replace(/^can not /, 'cannot ').split(' '));
  while (parts.length > 1 && LEADING_WORDS.has(parts[0])) parts.shift();
  return parts.join(' ');
}

/** Maximum edit distance allowed for a normalised accepted answer. */
export function typoTolerance(normalisedAccepted: string): number {
  return normalisedAccepted.length <= 8 ? 1 : 2;
}

/** The numbers in a normalised answer, in order, as one comparable string. */
const numbersOf = (text: string): string => (text.match(/[0-9]+/g) ?? []).join(',');

export function isAnswerCorrect(input: string, accepted: readonly string[]): boolean {
  const normalisedInput = normaliseAnswer(input);
  if (normalisedInput === '') return false;
  return accepted.some((answer) => {
    const target = normaliseAnswer(answer);
    if (target === '') return false;
    if (normalisedInput === target) return true;
    // Numerals are exact: "2" must never pass for "1", and a typo never turns "11" into "1".
    if (numbersOf(target) !== numbersOf(normalisedInput)) return false;
    return levenshtein(normalisedInput, target) <= typoTolerance(target);
  });
}
