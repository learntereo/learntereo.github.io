import { Link } from 'react-router';
import ui from '../components/ui.module.css';
import styles from './Reference.module.css';

interface Vowel {
  short: string;
  long: string;
  shortGuide: string;
  longGuide: string;
  shortWords: string;
  longWords: string;
}

const VOWELS: readonly Vowel[] = [
  { short: 'a', long: 'ā', shortGuide: 'like the "u" in "cut"', longGuide: 'like the "a" in "far"', shortWords: 'kai, ata', longWords: 'māmā, rā' },
  { short: 'e', long: 'ē', shortGuide: 'like the "e" in "pen"', longGuide: 'like "ai" in "air", without the "r"', shortWords: 'ngeru, wera', longWords: 'tēnā, hēki' },
  { short: 'i', long: 'ī', shortGuide: 'like the "ee" in "feet", said short', longGuide: 'like the "ee" in "feet", held longer', shortWords: 'ika, hiakai', longWords: 'kurī, tī' },
  { short: 'o', long: 'ō', shortGuide: 'like the "o" in "port", said short', longGuide: 'like the "or" in "port", held longer', shortWords: 'moana, poti', longWords: 'hōiho, kōrero' },
  { short: 'u', long: 'ū', shortGuide: 'like the "oo" in "put"', longGuide: 'like the "oo" in "moon"', shortWords: 'ua, kura', longWords: 'kūaha, tūī' },
];

/** A static guide to saying te reo Māori. The sound-alikes are approximate, and there is no audio yet. */
export function Pronunciation() {
  return (
    <main className={ui.page}>
      <div>
        <Link to="/reference" className={styles.back}>
          &larr; Reference
        </Link>
        <h1>Pronunciation</h1>
        <p className={ui.muted}>
          English sound-alikes only get you close. Listen to fluent speakers whenever you can, and ask a{' '}
          <span lang="mi">kaiako</span> to check how you sound.
        </p>
      </div>

      <section className={ui.card} aria-labelledby="vowels-title">
        <h2 id="vowels-title">The five vowels</h2>
        <p>
          Every vowel has a short and a long form. A long vowel has a line over it, called a macron (<span lang="mi">tohutō</span>).
          It has the same sound, held about twice as long. The macron can change the meaning of a word, so always write it.
        </p>
        <div className={styles.vowelGrid}>
          {VOWELS.map((v) => (
            <div key={v.short} className={styles.vowel}>
              <p className={styles.letters} lang="mi">
                {v.short} &middot; {v.long}
              </p>
              <p>
                <strong lang="mi">{v.short}</strong> {v.shortGuide}
                <br />
                <span className={styles.examples} lang="mi">
                  {v.shortWords}
                </span>
              </p>
              <p>
                <strong lang="mi">{v.long}</strong> {v.longGuide}
                <br />
                <span className={styles.examples} lang="mi">
                  {v.longWords}
                </span>
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className={ui.card} aria-labelledby="digraphs-title">
        <h2 id="digraphs-title">Two letters, one sound</h2>
        <ul className={styles.bullets}>
          <li>
            <strong lang="mi">wh</strong> is one sound. Most speakers say it like an English "f", as in{' '}
            <span lang="mi">whānau</span>, <span lang="mi">whare</span> and <span lang="mi">whetū</span>. Some regions say it
            closer to "w" or "h". Follow the speakers around you.
          </li>
          <li>
            <strong lang="mi">ng</strong> is one sound, like the "ng" in "singer" (not the "ng" in "finger"). It can start a
            word: <span lang="mi">ngeru</span>, <span lang="mi">ngā</span>, <span lang="mi">ngahere</span>.
          </li>
        </ul>
      </section>

      <section className={ui.card} aria-labelledby="consonants-title">
        <h2 id="consonants-title">Consonants</h2>
        <p>
          The consonants are <span lang="mi">h, k, m, n, p, r, t, w</span> plus <span lang="mi">wh</span> and{' '}
          <span lang="mi">ng</span>. Most sound close to their English letters.
        </p>
        <ul className={styles.bullets}>
          <li>
            <strong lang="mi">r</strong> is a quick tap of the tongue, a bit like the "tt" in "butter", as in{' '}
            <span lang="mi">rua</span> and <span lang="mi">kurī</span>. It is not the English "r".
          </li>
        </ul>
      </section>

      <section className={ui.card} aria-labelledby="syllables-title">
        <h2 id="syllables-title">Syllables and stress</h2>
        <ul className={styles.bullets}>
          <li>Every syllable ends in a vowel, and consonants are never bunched together. Say <span lang="mi">wha-re-pa-ku</span>, not "whar-pak".</li>
          <li>
            Two vowels side by side are said one after the other, smoothly: <span lang="mi">ka-i</span>,{' '}
            <span lang="mi">kia o-ra</span>.
          </li>
          <li>
            Keep the syllables even and give long vowels (the ones with a macron) a little extra weight, as in{' '}
            <span lang="mi">mā-mā</span> and <span lang="mi">whā-nau</span>.
          </li>
        </ul>
      </section>
    </main>
  );
}
