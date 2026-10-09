import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { getItem, isWord, units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { glossaryEntries, searchGlossary } from '../../game/glossarySearch';
import ui from '../components/ui.module.css';
import styles from './Reference.module.css';

/** Words from the units the learner has opened, searchable with or without macrons. */
export function Glossary() {
  const { statuses, learned } = useAppData();
  const [query, setQuery] = useState('');

  const entries = useMemo(
    () =>
      glossaryEntries(
        units.filter((u) => statuses.get(u.id)?.state !== 'locked'),
        (id) => {
          const item = getItem(id);
          return item && isWord(item) ? item : undefined;
        },
      ),
    [statuses],
  );
  const results = searchGlossary(entries, query);

  return (
    <main className={ui.page}>
      <div>
        <Link to="/reference" className={styles.back}>
          &larr; Reference
        </Link>
        <h1>Glossary</h1>
        <p className={ui.muted}>
          {entries.length} words from the units you have opened. A tick means you have got the word right.
        </p>
      </div>

      <div>
        <label className={ui.visuallyHidden} htmlFor="glossary-search">
          Search words in Māori or English
        </label>
        <input
          id="glossary-search"
          className={styles.search}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search in Māori or English"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
      </div>

      <p className={ui.muted} role="status" aria-live="polite">
        {query.trim() === '' ? '' : `${results.length} ${results.length === 1 ? 'word' : 'words'} found`}
      </p>

      <ul className={styles.entries}>
        {results.map((entry) => (
          <li key={entry.id} className={styles.entry}>
            <span className={styles.entryMi} lang="mi">
              {entry.mi}
            </span>
            <span>{entry.en[0]}</span>
            <span className={styles.tick}>
              {learned.has(entry.id) ? (
                <>
                  <span aria-hidden="true">{'✓'}</span>
                  <span className={ui.visuallyHidden}>Learned</span>
                </>
              ) : null}
            </span>
            <span className={styles.entryUnit}>{entry.unitTitle}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
