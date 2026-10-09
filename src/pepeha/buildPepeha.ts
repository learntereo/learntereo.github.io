import { ALL_PLACES, MAUNGA, WATERS, resolveName, type Suggestion } from './places';

export type PepehaKind = 'maori' | 'tauiwi';
export type WaterType = 'awa' | 'roto' | 'moana';

export interface PepehaInput {
  /** Decides the template. Null until the person chooses, which builds nothing. */
  kind: PepehaKind | null;
  name: string;
  /** Māori template: your mountain. Tauiwi template: a mountain that matters to you. */
  maunga: string;
  waterType: WaterType;
  /** Māori template: your river, lake or sea. Tauiwi template: water that matters to you. */
  water: string;
  waka: string;
  iwi: string;
  hapu: string;
  marae: string;
  father: string;
  mother: string;
  /** Tauiwi: where your ancestors are from (up to two places). */
  ancestors1: string;
  ancestors2: string;
  born: string;
  grewUp: string;
  live: string;
  work: string;
}

export interface PepehaLine {
  mi: string;
  en: string;
}

export const EMPTY_INPUT: PepehaInput = {
  kind: null,
  name: '',
  maunga: '',
  waterType: 'awa',
  water: '',
  waka: '',
  iwi: '',
  hapu: '',
  marae: '',
  father: '',
  mother: '',
  ancestors1: '',
  ancestors2: '',
  born: '',
  grewUp: '',
  live: '',
  work: '',
};

export const OPENING: PepehaLine = { mi: 'Tēnā koutou katoa', en: 'Greetings to you all' };
export const CLOSING: PepehaLine = { mi: 'Nō reira, tēnā koutou, tēnā koutou, tēnā koutou katoa', en: 'So, greetings to you all' };

/** English word for each kind of water. */
export const WATER_EN: Record<WaterType, string> = { awa: 'river', roto: 'lake', moana: 'sea' };

/**
 * Turns the form into pepeha lines, te reo with an English line for each.
 * Empty fields drop their line. Returns nothing until a template is chosen and a name is given.
 */
export function buildPepeha(input: PepehaInput): PepehaLine[] {
  const name = input.name.trim();
  if (!input.kind || !name) return [];

  const lines: PepehaLine[] = [OPENING];
  const add = (typed: string, make: (value: Suggestion) => PepehaLine, list: Suggestion[] = []) => {
    if (typed.trim()) lines.push(make(resolveName(list, typed)));
  };
  const water = input.waterType;

  if (input.kind === 'maori') {
    add(input.maunga, (v) => ({ mi: `Ko ${v.mi} te maunga`, en: `${v.en} is my mountain` }), MAUNGA);
    add(input.water, (v) => ({ mi: `Ko ${v.mi} te ${water}`, en: `${v.en} is my ${WATER_EN[water]}` }), WATERS);
    add(input.waka, (v) => ({ mi: `Ko ${v.mi} te waka`, en: `${v.en} is my canoe` }));
    add(input.iwi, (v) => ({ mi: `Ko ${v.mi} te iwi`, en: `${v.en} is my tribe` }));
    add(input.hapu, (v) => ({ mi: `Ko ${v.mi} te hapū`, en: `${v.en} is my subtribe` }));
    add(input.marae, (v) => ({ mi: `Ko ${v.mi} te marae`, en: `${v.en} is my marae` }));
  } else {
    const places = [input.ancestors1, input.ancestors2].filter((p) => p.trim()).map((p) => resolveName(ALL_PLACES, p));
    if (places.length > 0) {
      lines.push({
        mi: `Nō ${places.map((p) => p.mi).join(' me ')} ōku tūpuna`,
        en: `My ancestors are from ${places.map((p) => p.en).join(' and ')}`,
      });
    }
    add(input.born, (v) => ({ mi: `I whānau mai au ki ${v.mi}`, en: `I was born in ${v.en}` }), ALL_PLACES);
    add(input.grewUp, (v) => ({ mi: `I tipu ake au ki ${v.mi}`, en: `I grew up in ${v.en}` }), ALL_PLACES);
    add(
      input.maunga,
      (v) => ({ mi: `Ko ${v.mi} te maunga`, en: `${v.en} is the mountain I feel connected to` }),
      MAUNGA,
    );
    add(
      input.water,
      (v) => ({ mi: `Ko ${v.mi} te ${water}`, en: `${v.en} is the ${WATER_EN[water]} I feel connected to` }),
      WATERS,
    );
    add(input.live, (v) => ({ mi: `Kei ${v.mi} au e noho ana`, en: `I live in ${v.en}` }), ALL_PLACES);
  }

  add(input.father, (v) => ({ mi: `Ko ${v.mi} tōku pāpā`, en: `${v.en} is my father` }));
  add(input.mother, (v) => ({ mi: `Ko ${v.mi} tōku māmā`, en: `${v.en} is my mother` }));
  lines.push({ mi: `Ko ${name} tōku ingoa`, en: `My name is ${name}` });
  add(input.work, (v) => ({ mi: `Kei ${v.mi} au e mahi ana`, en: `I work at ${v.en}` }));
  lines.push(CLOSING);
  return lines;
}

/** The te reo lines only, one per line, ready to paste. */
export function pepehaToText(lines: PepehaLine[]): string {
  return lines.map((l) => `${l.mi}.`).join('\n');
}
