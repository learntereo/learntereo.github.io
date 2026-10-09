import type { ReactNode } from 'react';
import styles from './Treasure.module.css';

/** Original flat illustrations on a 48 x 48 grid, one consistent style: soft colours and a dark brown outline. */
const INK = '#4a3328';

/**
 * A silver fern frond: one curved stem from the bottom left to the top right, with
 * alternating pointed pinnae on both sides. They angle towards the tip and shrink
 * towards it. Each pinna is silver-white with a grey-green shade on one side.
 */
function fern(): ReactNode[] {
  const P0 = [9, 41];
  const C = [13, 14];
  const P2 = [38, 9];
  const at = (t: number) => {
    const u = 1 - t;
    return [u * u * P0[0] + 2 * u * t * C[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * C[1] + t * t * P2[1]];
  };
  const tangent = (t: number) => {
    const dx = 2 * (1 - t) * (C[0] - P0[0]) + 2 * t * (P2[0] - C[0]);
    const dy = 2 * (1 - t) * (C[1] - P0[1]) + 2 * t * (P2[1] - C[1]);
    const n = Math.hypot(dx, dy);
    return [dx / n, dy / n];
  };
  const out: ReactNode[] = [];
  const PER_SIDE = 14;
  const ANGLE = (52 * Math.PI) / 180;
  for (let i = 0; i < PER_SIDE * 2; i++) {
    const side = i % 2 === 0 ? -1 : 1; // alternate left and right
    const k = Math.floor(i / 2) + (side === 1 ? 0.5 : 0);
    const t = 0.1 + (0.8 * k) / PER_SIDE;
    const [x, y] = at(t);
    const [tx, ty] = tangent(t);
    const len = 12.5 - 9.5 * ((t - 0.1) / 0.8); // long at the base, short at the tip
    const cos = Math.cos(side * ANGLE);
    const sin = Math.sin(side * ANGLE);
    const dx = tx * cos - ty * sin;
    const dy = tx * sin + ty * cos;
    const ex = x + dx * len;
    const ey = y + dy * len;
    const nx = -dy;
    const ny = dx;
    const w = 1.5 + len * 0.1; // half width at the widest point
    const mx = x + dx * len * 0.45;
    const my = y + dy * len * 0.45;
    const lens = `M${x.toFixed(2)} ${y.toFixed(2)} Q${(mx + nx * w).toFixed(2)} ${(my + ny * w).toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)} Q${(mx - nx * w).toFixed(2)} ${(my - ny * w).toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} Z`;
    const shade = `M${x.toFixed(2)} ${y.toFixed(2)} Q${(mx + nx * w * 0.9).toFixed(2)} ${(my + ny * w * 0.9).toFixed(2)} ${ex.toFixed(2)} ${ey.toFixed(2)} L${x.toFixed(2)} ${y.toFixed(2)} Z`;
    out.push(
      <path key={`p${i}`} d={lens} fill="#EEF1EE" />,
      <path key={`s${i}`} d={shade} fill="#B9C4BC" />,
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
      <rect x="1" y="1" width="46" height="46" rx="11" fill="#1F2A24" />
      {fern()}
      <path d="M9 41 Q13 14 38 9 Q43 8.5 43.5 12.5 Q43.8 16 40.5 15.6" fill="none" stroke="#EEF1EE" strokeWidth="1.6" strokeLinecap="round" />
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
  pukeko: (
    <>
      <path d="M18 34 L16 44 M26 34 L26 44" stroke="#d6453b" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M10 28 Q8 14 22 12 Q34 12 36 24 Q38 36 22 36 Q12 36 10 28 Z" fill="#2c4a8c" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 26 Q22 30 32 26" fill="none" stroke="#5a86c8" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 14 L33 6 Q40 6 40 12 L36 17 Z" fill="#d6453b" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="30" cy="16" r="1.4" fill="#fff" />
      <path d="M8 34 L5 38" stroke="#f1f1f1" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  kumara: (
    <>
      <path d="M6 30 Q10 14 26 16 Q42 18 43 28 Q42 38 24 36 Q10 36 6 30 Z" fill="#c9764f" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 27 Q22 22 36 26" fill="none" stroke="#e7a37a" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M16 33 Q26 31 36 33" fill="none" stroke="#a85a38" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 29 L3 29 M42 30 L46 31" stroke={INK} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  kowhai: (
    <>
      <path d="M8 6 Q24 8 38 20" fill="none" stroke="#6b8a4a" strokeWidth="2.4" strokeLinecap="round" />
      {[
        [12, 12],
        [20, 14],
        [28, 18],
        [34, 24],
      ].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <path d={`M${x} ${y} Q${x - 3} ${y + 9} ${x + 1} ${y + 16} Q${x + 7} ${y + 10} ${x + 4} ${y + 3} Z`} fill="#f2c14e" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx={x + 1} cy={y + 8} r="1.2" fill="#d79a3b" />
        </g>
      ))}
    </>
  ),
  weta: (
    <>
      <path d="M14 26 Q4 14 6 6 M14 28 Q2 30 4 42 M32 26 Q44 14 42 6 M32 28 Q46 30 44 42" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      <ellipse cx="23" cy="28" rx="10" ry="8" fill="#a8774a" stroke={INK} strokeWidth="2" />
      <path d="M15 26 H31 M16 31 H30" stroke="#6f4a2b" strokeWidth="1.8" />
      <circle cx="23" cy="18" r="5" fill="#a8774a" stroke={INK} strokeWidth="2" />
      <path d="M20 14 Q14 6 10 8 M26 14 Q32 6 38 8" fill="none" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="21" cy="17" r="1.1" fill={INK} />
      <circle cx="26" cy="17" r="1.1" fill={INK} />
    </>
  ),
  tuatara: (
    <>
      <path d="M6 32 Q10 24 22 26 Q34 20 42 28 L46 26 L44 32 Q34 38 22 36 Q12 40 4 36 Z" fill="#6f9a5a" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      {[14, 19, 24, 29, 34].map((x) => (
        <path key={x} d={`M${x} ${26 - (x > 20 ? 1 : 0)} l2 -5 l2 5`} fill="#c8d98a" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
      ))}
      <path d="M12 36 L10 43 M30 36 L32 43" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="40" cy="27" r="1.4" fill={INK} />
    </>
  ),
  kereru: (
    <>
      <path d="M4 44 H44" stroke="#8a6a4c" strokeWidth="3" strokeLinecap="round" />
      <path d="M10 38 Q6 20 20 12 Q34 6 38 20 Q40 34 26 40 Z" fill="#3f7d63" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M26 40 Q36 36 38 22 Q42 28 38 36 Q34 42 26 40 Z" fill="#fbfaf5" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 30 Q20 22 30 20" fill="none" stroke="#7bbf9c" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 14 L44 16 L36 19 Z" fill="#d6453b" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <circle cx="32" cy="15" r="1.3" fill={INK} />
    </>
  ),
  piwakawaka: (
    <>
      <path d="M22 28 Q8 30 4 16 Q16 16 22 24 Z" fill="#f4efe4" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M22 28 Q10 36 5 30" fill="none" stroke={INK} strokeWidth="1.4" />
      <path d="M22 24 Q26 12 36 14 Q42 20 36 28 Q30 34 22 28 Z" fill="#6a5240" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
      <path d="M28 26 Q34 28 38 24" fill="none" stroke="#e9cf9a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M38 18 L45 20 L38 22 Z" fill="#d79a3b" stroke={INK} strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="33" cy="18" r="1.3" fill="#fff" stroke={INK} strokeWidth="0.6" />
      <path d="M28 33 L27 40 M32 32 L33 40" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  feijoa: (
    <>
      <ellipse cx="24" cy="26" rx="14" ry="17" fill="#7fae48" stroke={INK} strokeWidth="2" />
      <path d="M16 18 Q24 12 32 18" fill="none" stroke="#a8cf70" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M21 9 Q24 6 27 9 L26 12 H22 Z" fill="#5d7f33" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M24 5 L24 9" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  'chilly-bin': (
    <>
      <rect x="6" y="19" width="36" height="22" rx="3" fill="#3d86c6" stroke={INK} strokeWidth="2" />
      <rect x="4" y="13" width="40" height="9" rx="3" fill="#f4f4f1" stroke={INK} strokeWidth="2" />
      <path d="M16 13 Q24 3 32 13" fill="none" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M12 28 H36 M12 34 H36" stroke="#7bb4e0" strokeWidth="1.8" />
    </>
  ),
  'number-8-wire': (
    <>
      <path d="M24 24 C14 8 6 18 14 26 C20 32 24 24 24 24 C24 24 28 16 34 18 C42 22 38 34 30 32 C24 30 24 24 24 24 C24 24 20 34 14 34 C6 34 4 28 10 26" fill="none" stroke="#8a8f98" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 24 C14 8 6 18 14 26" fill="none" stroke="#c9ced6" strokeWidth="1" strokeLinecap="round" />
      <path d="M24 24 C24 24 28 16 34 18 C42 22 38 34 30 32" fill="none" stroke={INK} strokeWidth="0.8" strokeLinecap="round" />
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
  /** Show the generic locked tile (a padlock): nothing about the treasure is drawn. */
  locked?: boolean;
}

/** A kiwiana treasure drawing. Decorative: the name and state are always given in text beside it. */
export function TreasureIcon({ id, size = 36, locked = false }: TreasureIconProps) {
  return (
    <span className={`${styles.wrap} ${locked ? styles.locked : ''}`} style={{ width: size, height: size }} aria-hidden="true">
      {locked ? (
        // A locked treasure reveals nothing: no shape, only a padlock on a neutral tile.
        <svg className={styles.svg} width={size} height={size} viewBox="0 0 48 48" focusable="false" data-locked="true">
          <rect x="1" y="1" width="46" height="46" rx="12" fill="#e8e4de" stroke="#cfc8be" strokeWidth="1.5" />
          <path d="M17 22v-5a7 7 0 0 1 14 0v5" fill="none" stroke="#8d857c" strokeWidth="3" strokeLinecap="round" />
          <rect x="13" y="22" width="22" height="16" rx="3.5" fill="#a39b91" />
          <circle cx="24" cy="29.5" r="2.4" fill="#e8e4de" />
          <rect x="22.9" y="30" width="2.2" height="4.5" rx="1" fill="#e8e4de" />
        </svg>
      ) : (
        <svg className={styles.svg} width={size} height={size} viewBox="0 0 48 48" focusable="false">
          {ART[id] ?? ART.paua}
        </svg>
      )}
    </span>
  );
}
