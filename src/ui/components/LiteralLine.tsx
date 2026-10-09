import { literalFor } from '../../game/display';
import type { Item } from '../../game/types';
import styles from './Breakdown.module.css';

/** A short muted line under a meaning: Literally: "be healthy, be well". Nothing when it adds no information. */
export function LiteralLine({ item, className }: { item: Item; className?: string }) {
  const literal = literalFor(item);
  if (!literal) return null;
  return <p className={`${styles.literalLine} ${className ?? ''}`}>Literally: &ldquo;{literal}&rdquo;</p>;
}
