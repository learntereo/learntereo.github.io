import { Link } from 'react-router';
import { grammarFor, units } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { GrammarNote } from '../components/GrammarNote';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL } from '../labels';
import styles from './Reference.module.css';

/** Every grammar note from the units the learner has opened. */
export function Grammar() {
  const { statuses } = useAppData();
  const open = units.filter((u) => statuses.get(u.id)?.state !== 'locked');

  return (
    <main className={ui.page}>
      <div>
        <Link to="/reference" className={styles.back}>
          &larr; Reference
        </Link>
        <h1>Grammar</h1>
        <p className={ui.muted}>
          {open.length} of {units.length}
        </p>
      </div>

      <div className={styles.unitList}>
        {open.map((unit) => {
          const note = grammarFor(unit);
          if (!note) return null;
          return (
            <details key={unit.id} className={ui.card}>
              <summary className={styles.summary}>
                <span className={styles.summaryTitle}>{unit.title}</span>
                <span className={styles.summaryMeta}>
                  {LEVEL_LABEL[unit.level]} &middot; Unit {unit.order} &middot; <span lang="mi">{unit.titleMi}</span>
                </span>
              </summary>
              <GrammarNote markdown={note} />
              <Link to={`/unit/${unit.id}`}>Go to this unit</Link>
            </details>
          );
        })}
      </div>
    </main>
  );
}
