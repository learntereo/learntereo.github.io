import { Link } from 'react-router';
import { units } from '../../content/content';
import { FACTS } from '../../content/facts';
import { useAppData } from '../../data/AppDataContext';
import { TreasureIcon } from '../components/Treasure';
import ui from '../components/ui.module.css';
import styles from './KnowRero.module.css';
import refStyles from './Reference.module.css';

/** All the Know-rero facts in course order: the text once the unit is complete, a padlock until then. */
export function KnowRero() {
  const { statuses } = useAppData();
  const rows = FACTS.flatMap((fact) => {
    const unit = units[fact.afterUnit - 1];
    return unit ? [{ fact, unit, got: statuses.get(unit.id)?.state === 'complete' }] : [];
  });
  const count = rows.filter((r) => r.got).length;

  return (
    <main className={ui.page}>
      <div>
        <Link to="/reference" className={refStyles.back}>
          &larr; Reference
        </Link>
        <h1>Know-rero</h1>
        <p className={ui.muted}>
          {count} / {rows.length}
        </p>
      </div>

      <ul className={styles.list}>
        {rows.map(({ fact, unit, got }) => (
          <li key={fact.afterUnit} className={`${ui.card} ${styles.item}`}>
            {got ? (
              <div>
                <p className={styles.label}>{unit.title}</p>
                <p className={styles.text}>{fact.text}</p>
              </div>
            ) : (
              <>
                <TreasureIcon id="paua" size={40} locked />
                <p className={styles.locked}>Finish {unit.title} to unlock</p>
              </>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
