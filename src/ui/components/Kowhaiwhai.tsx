import { useId } from 'react';
import styles from './Kowhaiwhai.module.css';

/**
 * Original kōwhaiwhai-inspired decoration: koru-style spirals on a flowing stem.
 * These are drawn for Ako and are not copies of any iwi or hapū design.
 */

// One repeating tile: a stem that rises into a spiral, then a half-turned copy.
const KORU = 'M0 14 C 9 14 13 4 23 4 C 31 4 34 10 30 13.5 C 27 16 22.5 14.5 23.5 11';

/** A repeating decorative band. Decorative only: hidden from assistive tech. */
export function KowhaiwhaiBorder({ height = 28, className }: { height?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      className={`${styles.border} ${className ?? ''}`}
      width="100%"
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={id} width="60" height="28" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d={KORU} />
            <path d={KORU} transform="rotate(180 30 14)" />
          </g>
          <circle cx="23.5" cy="11" r="1.8" fill="currentColor" />
          <circle cx="36.5" cy="17" r="1.8" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** A single koru spiral used as a logo mark. */
export function KoruMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
        <path d="M6 27 C 6 14 14 6 22 6 C 27 6 28 11 25 13.5 C 22.5 15.5 19 13.5 20.5 11" />
      </g>
      <circle cx="20.5" cy="11" r="2" fill="currentColor" />
    </svg>
  );
}

/** Larger flourish with a draw-in animation, used when Intermediate unlocks. */
export function KoruFlourish({ className }: { className?: string }) {
  return (
    <svg className={`${styles.flourish} ${className ?? ''}`} viewBox="0 0 240 80" aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path className={styles.draw} pathLength="1" d="M10 70 C 40 70 52 14 100 14 C 134 14 142 44 122 54 C 108 61 90 52 96 38" />
        <path
          className={styles.draw}
          pathLength="1"
          d="M230 70 C 200 70 188 14 140 14 C 106 14 98 44 118 54 C 132 61 150 52 144 38"
        />
      </g>
      <circle cx="96" cy="38" r="3.5" fill="currentColor" />
      <circle cx="144" cy="38" r="3.5" fill="currentColor" />
    </svg>
  );
}
