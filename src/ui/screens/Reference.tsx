import { Link } from 'react-router';
import ui from '../components/ui.module.css';
import styles from './Reference.module.css';

const PAGES = [
  { to: '/grammar', title: 'Grammar', text: 'The short grammar note from every unit you have opened.' },
  { to: '/pronunciation', title: 'Pronunciation', text: 'Vowels, macrons, wh, ng and stress, with words from the course.' },
  { to: '/glossary', title: 'Glossary', text: 'Look up any word you have met. Search works with or without macrons.' },
  { to: '/little-words', title: 'Little words', text: 'What te, ngā, he, ko, kei te, ka and the other small words do.' },
] as const;

/** The Reference tab: grammar, pronunciation, little words and a glossary. */
export function Reference() {
  return (
    <main className={ui.page}>
      <div>
        <h1>Reference</h1>
      </div>
      <ul className={styles.list}>
        {PAGES.map((page) => (
          <li key={page.to}>
            <Link to={page.to} className={`${ui.card} ${styles.page}`}>
              <span className={styles.title}>{page.title}</span>
            </Link>
          </li>
        ))}
        <li>
          <Link to="/practice" className={`${ui.card} ${styles.page}`}>
            <span className={styles.title}>Free practice</span>
          </Link>
        </li>
      </ul>
    </main>
  );
}
