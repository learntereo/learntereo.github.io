import { factForUnit } from '../../content/facts';
import ui from './ui.module.css';
import styles from './FactCard.module.css';

/** The Know-rero fact for a unit. */
export function FactCard({ unitId }: { unitId: string }) {
  const fact = factForUnit(unitId);
  if (!fact) return null;
  return (
    <section className={`${ui.card} ${styles.fact}`} aria-labelledby={`fact-${unitId}`}>
      <h2 id={`fact-${unitId}`} className={styles.title}>
        Know-rero
      </h2>
      <p className={styles.text}>{fact}</p>
    </section>
  );
}
