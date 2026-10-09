import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useParticles } from '../../content/particles';
import { searchParticles } from '../../game/glossarySearch';
import ui from '../components/ui.module.css';
import styles from './Reference.module.css';

/** The little words (particles) dictionary, searchable with or without macrons. */
export function LittleWords() {
  const particles = useParticles();
  const [query, setQuery] = useState('');
  const { hash } = useLocation();
  const results = useMemo(() => (particles ? searchParticles(particles, query) : []), [particles, query]);

  // Arriving from a tapped word: scroll to that entry.
  useEffect(() => {
    if (!particles || !hash) return;
    document.getElementById(hash.replace(/^#/, ''))?.scrollIntoView?.({ block: 'start' });
  }, [particles, hash]);

  return (
    <main className={ui.page}>
      <div>
        <Link to="/reference" className={styles.back}>
          &larr; Reference
        </Link>
        <h1>Little words</h1>
        <p className={ui.muted}>
          Small words such as <span lang="mi">te</span>, <span lang="mi">ngā</span> and <span lang="mi">kei te</span> do
          a lot of work in te reo Māori. Here is what each one does.
        </p>
      </div>

      <div>
        <label className={ui.visuallyHidden} htmlFor="little-words-search">
          Search little words
        </label>
        <input
          id="little-words-search"
          className={styles.search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search, for example nga or kei te"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <p className={ui.muted} role="status" aria-live="polite">
        {particles === null
          ? 'Loading...'
          : query.trim() === ''
            ? ''
            : `${results.length} ${results.length === 1 ? 'little word' : 'little words'} found`}
      </p>

      <ul className={styles.list}>
        {results.map((p) => (
          <li key={p.id} id={`little-${p.id}`} className={`${ui.card} ${styles.little}`}>
            <h2 className={styles.littleTitle} lang="mi">
              {p.forms.join(', ')}
            </h2>
            <p className={styles.littleGloss}>{p.gloss}</p>
            <p>{p.explanation}</p>
            <p className={styles.littleExample}>
              <span lang="mi">{p.example.mi}</span> <span className={ui.muted}>{p.example.en}</span>
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
