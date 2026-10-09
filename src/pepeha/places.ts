/** Suggestion data for the pepeha builder. One place to review every name and its te reo form. */

export interface Suggestion {
  /** The English name people type or pick. */
  en: string;
  /** The name used in the te reo line. Same as `en` when there is no separate te reo name. */
  mi: string;
}

const same = (name: string): Suggestion => ({ en: name, mi: name });

/** Towns and cities in New Zealand, English name to te reo name. */
export const NZ_PLACES: Suggestion[] = [
  { en: 'Auckland', mi: 'Tāmaki Makaurau' },
  { en: 'Wellington', mi: 'Te Whanganui-a-Tara' },
  { en: 'Christchurch', mi: 'Ōtautahi' },
  { en: 'Dunedin', mi: 'Ōtepoti' },
  { en: 'Hamilton', mi: 'Kirikiriroa' },
  same('Tauranga'),
  same('Rotorua'),
  { en: 'Napier', mi: 'Ahuriri' },
  { en: 'Nelson', mi: 'Whakatū' },
  { en: 'Palmerston North', mi: 'Te Papaioea' },
  { en: 'Invercargill', mi: 'Waihōpai' },
  { en: 'New Plymouth', mi: 'Ngāmotu' },
  same('Whangārei'),
  { en: 'Gisborne', mi: 'Tūranga-nui-a-Kiwa' },
  { en: 'Queenstown', mi: 'Tāhuna' },
  same('Whanganui'),
  same('Taupō'),
  { en: 'Hastings', mi: 'Heretaunga' },
];

/** Countries and island nations, English name to te reo name. */
export const COUNTRIES: Suggestion[] = [
  { en: 'England', mi: 'Ingarangi' },
  { en: 'Scotland', mi: 'Kōtirana' },
  { en: 'Ireland', mi: 'Airani' },
  { en: 'Wales', mi: 'Wēra' },
  { en: 'Australia', mi: 'Ahitereiria' },
  { en: 'China', mi: 'Haina' },
  { en: 'India', mi: 'Īnia' },
  { en: 'Samoa', mi: 'Hāmoa' },
  same('Tonga'),
  { en: 'Fiji', mi: 'Whītī' },
  { en: 'Cook Islands', mi: 'Kūki Airani' },
  { en: 'Netherlands', mi: 'Hōrana' },
  { en: 'Germany', mi: 'Tiamana' },
  { en: 'Philippines', mi: 'Piripīni' },
  { en: 'South Africa', mi: 'Āwherika ki te Tonga' },
  { en: 'United States', mi: 'Amerika' },
  // A proper place name in the pepeha itself.
  { en: 'New Zealand', mi: 'Aotearoa' },
];

/** Every place a person might be born, grow up or live in, or have ancestors from. */
export const ALL_PLACES: Suggestion[] = [...NZ_PLACES, ...COUNTRIES];

export const MAUNGA: Suggestion[] = [
  'Taranaki',
  'Ruapehu',
  'Tongariro',
  'Hikurangi',
  'Aoraki',
  'Maungawhau',
  'Rangitoto',
  'Pirongia',
  'Taupiri',
  'Maungatautari',
].map(same);

/** Rivers, lakes and seas. */
export const WATERS: Suggestion[] = [
  same('Waikato'),
  same('Whanganui'),
  same('Waimakariri'),
  same('Rangitīkei'),
  { en: 'Pacific Ocean', mi: 'Te Moana-nui-a-Kiwa' },
  { en: 'Lake Taupō', mi: 'Taupō-nui-a-Tia' },
  same('Waitematā'),
  same('Rotorua'),
];

const fold = (text: string) => text.trim().toLowerCase();

/** Matches typed text to a suggestion by English or te reo name, ignoring case. Unknown text is kept as typed. */
export function resolveName(list: Suggestion[], typed: string): Suggestion {
  const text = typed.trim();
  const hit = list.find((s) => fold(s.en) === fold(text) || fold(s.mi) === fold(text));
  return hit ?? { en: text, mi: text };
}
