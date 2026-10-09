import { Link } from 'react-router';
import { units } from '../../content/content';
import { FACTS } from '../../content/facts';
import { useAppData } from '../../data/AppDataContext';
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
  const { statuses } = useAppData();
  const known = FACTS.filter((f) => statuses.get(units[f.afterUnit - 1]?.id ?? '')?.state === 'complete').length;
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
          <Link to="/know-rero" className={`${ui.card} ${styles.page}`}>
            <span className={styles.title}>Know-rero</span>
            <span className={ui.muted}>
              {known} / {FACTS.length}
            </span>
          </Link>
        </li>
        <li>
          <Link to="/practice" className={`${ui.card} ${styles.page}`}>
            <span className={styles.title}>Free practice</span>
          </Link>
        </li>
        <li>
          <a href={`${import.meta.env.BASE_URL}pepeha/`} className={`${ui.card} ${styles.page}`}>
            <span className={styles.title}>Pepeha builder</span>
          </a>
        </li>
      </ul>
    </main>
  );
}
