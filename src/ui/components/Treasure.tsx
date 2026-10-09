import type { ReactNode } from 'react';
import styles from './Treasure.module.css';

/** Original flat illustrations on a 48 x 48 grid, one consistent style: soft colours and a dark brown outline. */
const INK = '#4a3328';

function leaflets(): ReactNode[] {
  // A fern frond: a curved stem with paired leaflets that shrink towards the tip.
  const out: ReactNode[] = [];
  for (let i = 0; i < 8; i++) {
    const t = i / 8;
    const x = 14 + 18 * t;
    const y = 42 - 34 * t;
    const len = 9 - 6 * t;
    out.push(
      <path key={`l${i}`} d={`M${x} ${y} l${-len} ${-len * 0.45}`} stroke="#8aa89a" strokeWidth="3" strokeLinecap="round" />,
      <path key={`r${i}`} d={`M${x} ${y} l${len} ${-len * 0.45}`} stroke="#8aa89a" strokeWidth="3" strokeLinecap="round" />,
    );
  }
  return out;
}

function stamens(): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const x1 = 24 + Math.cos(a) * 5;
    const y1 = 24 + Math.sin(a) * 5;
    const x2 = 24 + Math.cos(a) * 17;
    const y2 = 24 + Math.sin(a) * 17;
    out.push(
      <path key={`s${i}`} d={`M${x1} ${y1} L${x2} ${y2}`} stroke="#c4372b" strokeWidth="2.4" strokeLinecap="round" />,
      <circle key={`t${i}`} cx={x2} cy={y2} r="2" fill="#f2c14e" />,
    );
  }
  return out;
}

const ART: Record<string, ReactNode> = {
  paua: (
    <>
      <ellipse cx="24" cy="26" rx="19" ry="14" fill="#3c8d93" stroke={INK} strokeWidth="2" />
      <ellipse cx="24" cy="26" rx="13" ry="9" fill="#7fc4c0" />
      <path d="M12 26 Q24 14 36 26" fill="none" stroke="#b79ae0" strokeWidth="3" strokeLinecap="round" />
      <path d="M16 28 Q24 36 32 28" fill="none" stroke="#e7f5ef" strokeWidth="2" strokeLinecap="round" />
      {[10, 17, 24, 31].map((x) => (
        <circle key={x} cx={x + 2} cy={13 + Math.abs(x - 20) * 0.12} r="1.8" fill="#fff" stroke={INK} strokeWidth="1" />
      ))}
    </>
  ),
  jandals: (
    <>
      <ellipse cx="16" cy="26" rx="8" ry="16" fill="#f2c14e" stroke={INK} strokeWidth="2" transform="rotate(-12 16 26)" />
      <ellipse cx="33" cy="26" rx="8" ry="16" fill="#f2c14e" stroke={INK} strokeWidth="2" transform="rotate(12 33 26)" />
      <path d="M16 14 L14 28 M16 14 L20 26" stroke="#c4372b" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M33 14 L35 28 M33 14 L29 26" stroke="#c4372b" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  'silver-fern': (
    <>
      <path d="M14 42 Q16 20 32 8" fill="none" stroke="#6f8c80" strokeWidth="2.4" strokeLinecap="round" />
      {leaflets()}
    </>
  ),
  pohutukawa: (
    <>
      <path d="M4 40 Q12 30 20 36" fill="#4f9a5d" stroke={INK} strokeWidth="1.5" />
      {stamens()}
      <circle cx="24" cy="24" r="4.5" fill="#f2c14e" stroke={INK} strokeWidth="1.2" />
    </>
  ),
  gumboot: (
    <>
      <path d="M17 5 H31 V27 L42 32 Q46 35 44 41 H12 Q10 36 16 33 Z" fill="#4f9a5d" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <rect x="11" y="39" width="35" height="5" rx="2" fill="#3a3532" />
      <rect x="17" y="5" width="14" height="5" fill="#8cc59a" stroke={INK} strokeWidth="1.5" />
    </>
  ),
  pavlova: (
    <>
      <ellipse cx="24" cy="38" rx="21" ry="5" fill="#e9e1d4" stroke={INK} strokeWidth="1.5" />
      <path d="M8 36 Q10 18 24 16 Q38 18 40 36 Z" fill="#fffaf0" stroke={INK} strokeWidth="2" />
      <path d="M13 30 Q24 26 35 30" fill="none" stroke="#e7d9bf" strokeWidth="2" />
      <circle cx="19" cy="14" r="4" fill="#d6453b" stroke={INK} strokeWidth="1.3" />
      <circle cx="28" cy="13" r="4" fill="#b9d96b" stroke={INK} strokeWidth="1.3" />
      <circle cx="28" cy="13" r="1.4" fill="#4f7a2a" />
      <circle cx="24" cy="10" r="2.6" fill="#d6453b" stroke={INK} strokeWidth="1" />
    </>
  ),
  'fish-and-chips': (
    <>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={26 + i * 4} y={8 + i * 1.5} width="5" height="24" rx="2" fill="#f5d36a" stroke={INK} strokeWidth="1.3" transform={`rotate(${10 + i * 6} ${28 + i * 4} 20)`} />
      ))}
      <path d="M4 30 Q16 16 28 30 Q16 44 4 30 Z" fill="#d79a3b" stroke={INK} strokeWidth="2" />
      <path d="M26 30 L36 22 L36 38 Z" fill="#d79a3b" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="11" cy="28" r="1.6" fill={INK} />
    </>
  ),
  'hokey-pokey': (
    <>
      <path d="M14 24 L24 45 L34 24 Z" fill="#e0a85a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M17 28 L31 28 M19 33 L29 33" stroke="#c2853a" strokeWidth="1.5" />
      <circle cx="24" cy="17" r="12" fill="#fff4d2" stroke={INK} strokeWidth="2" />
      {[
        [19, 14],
        [27, 12],
        [24, 19],
        [30, 19],
        [18, 21],
      ].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x - 1.5} y={y - 1.5} width="3.4" height="3.4" rx="0.8" fill="#b9792b" />
      ))}
    </>
  ),
  tui: (
    <>
      <path d="M4 40 H44" stroke="#8a6a4c" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 36 Q8 20 22 13 Q34 8 38 20 Q40 32 28 38 Z" fill="#2f4a5a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 30 Q22 22 32 20" fill="none" stroke="#4f9aa0" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 14 L45 17 L36 20 Z" fill="#d79a3b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="30" cy="22" r="2.4" fill="#fff" />
      <circle cx="26" cy="24" r="2" fill="#fff" />
      <circle cx="33" cy="14" r="1.5" fill="#fff" />
      <circle cx="33" cy="14" r="0.7" fill={INK} />
    </>
  ),
  'golden-kiwi': (
    <>
      <ellipse cx="22" cy="28" rx="15" ry="13" fill="#e2ad2b" stroke={INK} strokeWidth="2" />
      <path d="M33 22 Q42 20 46 24" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M33 22 Q42 20 46 24" fill="none" stroke="#f6d36b" strokeWidth="1" strokeLinecap="round" />
      <circle cx="33" cy="22" r="1.4" fill={INK} />
      <path d="M16 40 L14 45 M26 40 L25 45" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M12 24 Q16 20 22 21 M11 29 Q17 25 24 27" fill="none" stroke="#f6d36b" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M10 8 l1.2 3 3 1.2 -3 1.2 -1.2 3 -1.2 -3 -3 -1.2 3 -1.2 z" fill="#f2c14e" />
    </>
  ),
};

interface TreasureIconProps {
  id: string;
  /** Pixel size (the icon is square). */
  size?: number;
  /** Show the grey silhouette with a question mark. */
  locked?: boolean;
}

/** A kiwiana treasure drawing. Decorative: the name and state are always given in text beside it. */
export function TreasureIcon({ id, size = 36, locked = false }: TreasureIconProps) {
  return (
    <span className={`${styles.wrap} ${locked ? styles.locked : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      <svg className={styles.svg} width={size} height={size} viewBox="0 0 48 48" focusable="false">
        {ART[id] ?? ART.paua}
      </svg>
      {locked && <span className={styles.mark}>?</span>}
    </span>
  );
}
