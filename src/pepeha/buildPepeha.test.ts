import { describe, expect, it } from 'vitest';
import { CLOSING, EMPTY_INPUT, OPENING, buildPepeha, pepehaToText, type PepehaInput } from './buildPepeha';
import { resolveName } from './places';
import { MAUNGA } from './places';

const input = (over: Partial<PepehaInput>): PepehaInput => ({ ...EMPTY_INPUT, ...over });
const mi = (over: Partial<PepehaInput>) => buildPepeha(input(over)).map((l) => l.mi);
const en = (over: Partial<PepehaInput>) => buildPepeha(input(over)).map((l) => l.en);

describe('buildPepeha basics', () => {
  it('builds nothing until a template is chosen', () => {
    expect(buildPepeha(input({ name: 'Aroha' }))).toEqual([]);
  });

  it('builds nothing without a name', () => {
    expect(buildPepeha(input({ kind: 'maori', maunga: 'Taranaki', name: '   ' }))).toEqual([]);
    expect(buildPepeha(input({ kind: 'tauiwi', live: 'Dunedin' }))).toEqual([]);
  });

  it('wraps every pepeha in the opening and closing greetings', () => {
    for (const kind of ['maori', 'tauiwi'] as const) {
      const lines = buildPepeha(input({ kind, name: 'Sam' }));
      expect(lines[0]).toEqual(OPENING);
      expect(lines[lines.length - 1]).toEqual(CLOSING);
    }
  });

  it('keeps the name as typed, trimmed', () => {
    expect(mi({ kind: 'tauiwi', name: '  Jo McKay ' })).toContain('Ko Jo McKay tōku ingoa');
    expect(en({ kind: 'tauiwi', name: 'Jo McKay' })).toContain('My name is Jo McKay');
  });
});

describe('Māori template', () => {
  const full = input({
    kind: 'maori',
    name: 'Aroha Smith',
    maunga: 'Taranaki',
    waterType: 'awa',
    water: 'Waikato',
    waka: 'Tainui',
    iwi: 'Ngāti Maniapoto',
    hapu: 'Ngāti Rora',
    marae: 'Te Kotahitanga',
    father: 'Hemi',
    mother: 'Mere',
    work: 'Te Papa',
  });

  it('writes the lines in order', () => {
    expect(buildPepeha(full)).toEqual([
      { mi: 'Tēnā koutou katoa', en: 'Greetings to you all' },
      { mi: 'Ko Taranaki te maunga', en: 'Taranaki is my mountain' },
      { mi: 'Ko Waikato te awa', en: 'Waikato is my river' },
      { mi: 'Ko Tainui te waka', en: 'Tainui is my canoe' },
      { mi: 'Ko Ngāti Maniapoto te iwi', en: 'Ngāti Maniapoto is my tribe' },
      { mi: 'Ko Ngāti Rora te hapū', en: 'Ngāti Rora is my subtribe' },
      { mi: 'Ko Te Kotahitanga te marae', en: 'Te Kotahitanga is my marae' },
      { mi: 'Ko Hemi tōku pāpā', en: 'Hemi is my father' },
      { mi: 'Ko Mere tōku māmā', en: 'Mere is my mother' },
      { mi: 'Ko Aroha Smith tōku ingoa', en: 'My name is Aroha Smith' },
      { mi: 'Kei Te Papa au e mahi ana', en: 'I work at Te Papa' },
      { mi: 'Nō reira, tēnā koutou, tēnā koutou, tēnā koutou katoa', en: 'So, greetings to you all' },
    ]);
  });

  it('drops empty and blank fields', () => {
    const lines = mi({ kind: 'maori', name: 'Aroha', iwi: 'Ngāi Tahu', hapu: '  ', marae: '' });
    expect(lines).toEqual([OPENING.mi, 'Ko Ngāi Tahu te iwi', 'Ko Aroha tōku ingoa', CLOSING.mi]);
  });

  it('uses the chosen kind of water in both languages', () => {
    expect(mi({ kind: 'maori', name: 'A', water: 'Rotorua', waterType: 'roto' })).toContain('Ko Rotorua te roto');
    expect(en({ kind: 'maori', name: 'A', water: 'Rotorua', waterType: 'roto' })).toContain('Rotorua is my lake');
    expect(mi({ kind: 'maori', name: 'A', water: 'Pacific Ocean', waterType: 'moana' })).toContain('Ko Te Moana-nui-a-Kiwa te moana');
    expect(en({ kind: 'maori', name: 'A', water: 'Pacific Ocean', waterType: 'moana' })).toContain('Pacific Ocean is my sea');
  });

  it('never asks for tauiwi lines', () => {
    const lines = mi({ ...full, ancestors1: 'England', born: 'Dunedin', live: 'Dunedin' });
    expect(lines.some((l) => l.includes('ōku tūpuna') || l.includes('whānau mai') || l.includes('noho ana'))).toBe(false);
  });

  it('can leave out the parents', () => {
    expect(mi({ kind: 'maori', name: 'A', father: 'Hemi' })).toContain('Ko Hemi tōku pāpā');
    expect(mi({ kind: 'maori', name: 'A' }).some((l) => l.includes('tōku pāpā') || l.includes('tōku māmā'))).toBe(false);
  });
});

describe('tauiwi template', () => {
  const full = input({
    kind: 'tauiwi',
    name: 'Sam Jones',
    ancestors1: 'England',
    born: 'Wellington',
    grewUp: 'Christchurch',
    maunga: 'Aoraki',
    waterType: 'moana',
    water: 'Pacific Ocean',
    live: 'Dunedin',
    father: 'Tom',
    mother: 'Jan',
    work: 'Otago Polytechnic',
  });

  it('writes the lines in order, using te reo place names', () => {
    expect(buildPepeha(full)).toEqual([
      { mi: 'Tēnā koutou katoa', en: 'Greetings to you all' },
      { mi: 'Nō Ingarangi ōku tūpuna', en: 'My ancestors are from England' },
      { mi: 'I whānau mai au ki Te Whanganui-a-Tara', en: 'I was born in Wellington' },
      { mi: 'I tipu ake au ki Ōtautahi', en: 'I grew up in Christchurch' },
      { mi: 'Ko Aoraki te maunga e tū whakahīhī ana ki ahau', en: 'Aoraki is the mountain I feel connected to' },
      { mi: 'Ko Te Moana-nui-a-Kiwa te moana e rere ana i roto i ahau', en: 'Pacific Ocean is the sea that flows within me' },
      { mi: 'Kei Ōtepoti au e noho ana', en: 'I live in Dunedin' },
      { mi: 'Ko Tom tōku pāpā', en: 'Tom is my father' },
      { mi: 'Ko Jan tōku māmā', en: 'Jan is my mother' },
      { mi: 'Ko Sam Jones tōku ingoa', en: 'My name is Sam Jones' },
      { mi: 'Kei Otago Polytechnic au e mahi ana', en: 'I work at Otago Polytechnic' },
      { mi: 'Nō reira, tēnā koutou, tēnā koutou, tēnā koutou katoa', en: 'So, greetings to you all' },
    ]);
  });

  it('never claims waka, iwi, hapū or marae', () => {
    const lines = mi({ ...full, waka: 'Tainui', iwi: 'Ngāi Tahu', hapu: 'X', marae: 'Y' });
    expect(lines.some((l) => /te (waka|iwi|hapū|marae)$/.test(l))).toBe(false);
  });

  it('joins two ancestral places with me / and', () => {
    const over = { kind: 'tauiwi', name: 'A', ancestors1: 'Scotland', ancestors2: 'Ireland' } as const;
    expect(mi(over)).toContain('Nō Kōtirana me Airani ōku tūpuna');
    expect(en(over)).toContain('My ancestors are from Scotland and Ireland');
  });

  it('uses the second ancestral place alone when the first is empty', () => {
    expect(mi({ kind: 'tauiwi', name: 'A', ancestors2: 'India' })).toContain('Nō Īnia ōku tūpuna');
  });

  it('drops empty fields', () => {
    expect(mi({ kind: 'tauiwi', name: 'A', live: 'Nelson' })).toEqual([OPENING.mi, 'Kei Whakatū au e noho ana', 'Ko A tōku ingoa', CLOSING.mi]);
  });

  it('keeps unknown places as typed', () => {
    expect(mi({ kind: 'tauiwi', name: 'A', born: 'Timaru' })).toContain('I whānau mai au ki Timaru');
    expect(en({ kind: 'tauiwi', name: 'A', born: 'Timaru' })).toContain('I was born in Timaru');
  });

  it('accepts the te reo name or any case for a suggestion', () => {
    expect(mi({ kind: 'tauiwi', name: 'A', live: 'auckland' })).toContain('Kei Tāmaki Makaurau au e noho ana');
    expect(mi({ kind: 'tauiwi', name: 'A', live: 'Tāmaki Makaurau' })).toContain('Kei Tāmaki Makaurau au e noho ana');
    expect(en({ kind: 'tauiwi', name: 'A', live: 'Tāmaki Makaurau' })).toContain('I live in Auckland');
  });

  it('supports a river or lake that matters', () => {
    expect(mi({ kind: 'tauiwi', name: 'A', water: 'Waikato', waterType: 'awa' })).toContain('Ko Waikato te awa e rere ana i roto i ahau');
    expect(en({ kind: 'tauiwi', name: 'A', water: 'Lake Taupō', waterType: 'roto' })).toContain('Lake Taupō is the lake that flows within me');
    expect(mi({ kind: 'tauiwi', name: 'A', water: 'Lake Taupō', waterType: 'roto' })).toContain('Ko Taupō-nui-a-Tia te roto e rere ana i roto i ahau');
  });

  it('supports New Zealand as an ancestral place', () => {
    expect(mi({ kind: 'tauiwi', name: 'A', ancestors1: 'New Zealand' })).toContain('Nō Aotearoa ōku tūpuna');
  });
});

describe('helpers', () => {
  it('resolveName leaves unknown names alone', () => {
    expect(resolveName(MAUNGA, ' Maunga Foo ')).toEqual({ en: 'Maunga Foo', mi: 'Maunga Foo' });
  });

  it('pepehaToText gives te reo only, one line each', () => {
    const text = pepehaToText(buildPepeha(input({ kind: 'tauiwi', name: 'A' })));
    expect(text).toBe(['Tēnā koutou katoa.', 'Ko A tōku ingoa.', 'Nō reira, tēnā koutou, tēnā koutou, tēnā koutou katoa.'].join('\n'));
  });
});
