import { units } from './content';

/** One fact per unit, shown after passing its Kiwiz. `afterUnit` is the unit's place in the course (1 to 22). */
export interface UnitFact {
  afterUnit: number;
  text: string;
}

export const FACTS: readonly UnitFact[] = [
  {
    afterUnit: 1,
    text: 'The first people to settle New Zealand sailed here from eastern Polynesia in double-hulled waka, around 1250 to 1300 AD. It was one of the last big land masses on Earth to be settled.',
  },
  {
    afterUnit: 2,
    text: 'Polynesian navigators crossed thousands of kilometres of open ocean with no instruments, reading the stars, swells, winds and birds.',
  },
  {
    afterUnit: 3,
    text: 'Early Māori hunted moa, flightless birds that could stand around 3.6 metres tall with their necks stretched up. Moa were gone within a couple of centuries of people arriving.',
  },
  {
    afterUnit: 4,
    text: 'Māori built pā, fortified villages on hills and headlands with terraces, ditches and palisades. You can still see thousands of pā sites around the country.',
  },
  {
    afterUnit: 5,
    text: 'To grow kūmara in our cooler climate, Māori gardeners mixed sand and gravel into the soil to warm it and help it drain.',
  },
  {
    afterUnit: 6,
    text: 'Whakapapa, waiata and carving carried knowledge from one generation to the next. Skilled speakers could recite genealogies going back many generations.',
  },
  {
    afterUnit: 7,
    text: 'In 1642 the Dutch explorer Abel Tasman became the first European known to reach New Zealand. The name comes from Zeeland, a province of the Netherlands.',
  },
  {
    afterUnit: 8,
    text: 'James Cook charted both main islands in 1769 and 1770 with remarkable accuracy. On board was Tupaia, a Tahitian navigator who could talk with Māori.',
  },
  {
    afterUnit: 9,
    text: 'In 1820 the rangatira Hongi Hika travelled to England and worked with Professor Samuel Lee at Cambridge on one of the first grammars of te reo Māori.',
  },
  {
    afterUnit: 10,
    text: 'Māori took to reading and writing fast. Within a few decades of missionaries arriving, many Māori could read and write in te reo, and the first Māori-language newspaper was printed in 1842.',
  },
  {
    afterUnit: 11,
    text: 'Britain chose to negotiate a treaty with Māori chiefs, something it never did in Australia. The Treaty of Waitangi was first signed on 6 February 1840, and around 500 rangatira signed copies around the country.',
  },
  {
    afterUnit: 12,
    text: 'The Treaty was written in both English and te reo Māori. The missionary Henry Williams and his son Edward translated it overnight before the signing.',
  },
  {
    afterUnit: 13,
    text: 'In the 1840s and 1850s Māori communities ran flour mills and trading ships and supplied food to the new settler towns, including Auckland and even Sydney.',
  },
  {
    afterUnit: 14,
    text: 'In 1867 Parliament created four Māori seats, and every Māori man aged 21 or over got the vote, years before all European men did.',
  },
  {
    afterUnit: 15,
    text: 'In 1893 New Zealand became the first self-governing country in the world to give women the vote. Māori women voted that year too.',
  },
  {
    afterUnit: 16,
    text: "Kate Sheppard led the campaign for women's votes. The 1893 petition was signed by around 32,000 women, and she's on our $10 note.",
  },
  {
    afterUnit: 17,
    text: 'New Zealand brought in old-age pensions in 1898, one of the first countries in the world to do so.',
  },
  {
    afterUnit: 18,
    text: "Ernest Rutherford, born near Nelson, won the Nobel Prize in Chemistry in 1908 and was the first to split the atom, in 1917. He's on our $100 note.",
  },
  {
    afterUnit: 19,
    text: 'Sir Āpirana Ngata of Ngāti Porou led a revival of Māori arts, haka and waiata, and set up a school of Māori carving in Rotorua in 1926.',
  },
  {
    afterUnit: 20,
    text: "The 28th (Māori) Battalion fought alongside British and Commonwealth forces in the Second World War and became one of New Zealand's most decorated units.",
  },
  {
    afterUnit: 21,
    text: 'Te Wiki o te Reo Māori, Māori Language Week, has been held every year since 1975.',
  },
  {
    afterUnit: 22,
    text: 'Kōhanga reo language nests began in 1982, and in 1987 te reo Māori became an official language of New Zealand.',
  },
];

/** How many facts are unlocked: those whose unit is complete. */
export function unlockedFactCount(isComplete: (unitId: string) => boolean): number {
  return FACTS.filter((f) => {
    const unit = units[f.afterUnit - 1];
    return unit !== undefined && isComplete(unit.id);
  }).length;
}

/** The fact for a unit, by its place in the course. */
export function factForUnit(unitId: string): string | undefined {
  const index = units.findIndex((u) => u.id === unitId);
  return index < 0 ? undefined : FACTS.find((f) => f.afterUnit === index + 1)?.text;
}
