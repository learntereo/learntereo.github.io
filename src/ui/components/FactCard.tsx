import { factForUnit } from '../../content/facts';
import ui from './ui.module.css';
import styles from './FactCard.module.css';

/** "Did you know?" fact for a unit. */
export function FactCard({ unitId }: { unitId: string }) {
  const fact = factForUnit(unitId);
  if (!fact) return null;
  return (
    <section className={`${ui.card} ${styles.fact}`} aria-labelledby={`fact-${unitId}`}>
      <h2 id={`fact-${unitId}`} className={styles.title}>
        Did you know?
      </h2>
      <p className={styles.text}>{fact}</p>
    </section>
  );
}
