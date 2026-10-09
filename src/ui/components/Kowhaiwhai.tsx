import { useId } from 'react';
import styles from './Kowhaiwhai.module.css';

/**
 * Original kōwhaiwhai-inspired decoration: koru-style spirals on a flowing stem.
 * These are drawn for Ako and are not copies of any iwi or hapū design.
 */

// One 80 x 40 tile in the kōwhaiwhai colours: a kōkōwai field edged in white, with a
// koru rising from the lower edge and its mirror hanging from the upper edge. Each koru
// is a thick stem that curls in and ends in a round bulb, as painted rafter
// patterns do. The pair interlocks with the next tile to make a continuous band.
const RISING = 'M8 37 C 8 21 18 11 30 11 C 40 11 42 21 35 24 C 30 26 26 22 29 19';
const HANGING = 'M72 3 C 72 19 62 29 50 29 C 40 29 38 19 45 16 C 50 14 54 18 51 21';

/** A repeating decorative band. Decorative only: hidden from assistive tech. */
export function KowhaiwhaiBorder({ height = 28, className }: { height?: number; className?: string }) {
  const id = useId();
  const scale = height / 40;
  return (
    <svg
      className={`${styles.border} ${className ?? ''}`}
      width="100%"
      height={height}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={id} width="80" height="40" patternUnits="userSpaceOnUse" patternTransform={`scale(${scale})`}>
          <rect width="80" height="40" fill="var(--color-kokowai)" />
          <rect width="80" height="3" fill="var(--color-ma)" />
          <rect y="37" width="80" height="3" fill="var(--color-ma)" />
          <g fill="none" stroke="var(--color-ma)" strokeWidth="5" strokeLinecap="round">
            <path d={RISING} />
            <path d={HANGING} />
          </g>
          <g fill="var(--color-ma)">
            <circle cx="29.5" cy="19.5" r="5.2" />
            <circle cx="50.5" cy="20.5" r="5.2" />
          </g>
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
