import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { getTitleBreakdown } from '../../content/content';
import { useParticles } from '../../content/particles';
import type { Breakdown as BreakdownData, GlossToken } from '../../game/types';
import styles from './Breakdown.module.css';

interface BreakdownProps {
  breakdown: BreakdownData;
  /** Hide the literal translation and note (the tap-a-word row only). */
  compact?: boolean;
}

/** One Māori word with its gloss under it. Tapping opens a small popover. */
function WordButton({
  token,
  open,
  popoverId,
  onToggle,
  buttonRef,
}: {
  token: GlossToken;
  open: boolean;
  popoverId: string;
  onToggle: () => void;
  buttonRef: (node: HTMLButtonElement | null) => void;
}) {
  return (
    <button
      type="button"
      ref={buttonRef}
      className={`${styles.word} ${open ? styles.wordOpen : ''}`}
      aria-expanded={open}
      aria-controls={open ? popoverId : undefined}
      aria-haspopup="dialog"
      onClick={onToggle}
    >
      <span className={styles.mi} lang="mi">
        {token.mi}
      </span>
      <span className={styles.en}>{token.en}</span>
    </button>
  );
}

function Popover({ token, id, onClose }: { token: GlossToken; id: string; onClose: () => void }) {
  const particles = useParticles(token.ref !== undefined);
  const particle = token.ref ? particles?.find((p) => p.id === token.ref) : undefined;
  return (
    <div className={styles.popover} id={id} role="dialog" aria-label={`About ${token.mi}`}>
      <p className={styles.popoverTitle}>
        <span lang="mi">{token.mi}</span> <span className={styles.popoverGloss}>means {token.en}</span>
      </p>
      {token.ref && !particle && particles === null && <p className={styles.muted}>Loading...</p>}
      {particle && (
        <>
          <p className={styles.popoverText}>{particle.explanation}</p>
          <p className={styles.popoverExample}>
            <span lang="mi">{particle.example.mi}</span> <span className={styles.muted}>{particle.example.en}</span>
          </p>
          <Link className={styles.popoverLink} to={{ pathname: '/little-words', hash: `#little-${particle.id}` }}>
            See it in Little words
          </Link>
        </>
      )}
      <button type="button" className={styles.close} onClick={onClose}>
        Close
      </button>
    </div>
  );
}

/**
 * Word-by-word breakdown, interlinear style: each Māori word with its English
 * gloss under it, then the literal English and a short note. Tap a word to see
 * what it does (a button with aria-expanded; Escape or a click outside closes it).
 */
export function Breakdown({ breakdown, compact = false }: BreakdownProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const popoverId = useId();

  useEffect(() => {
    if (openIndex === null) return;
    const index = openIndex;
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpenIndex(null);
      buttons.current[index]?.focus();
    }
    function onPointer(event: Event) {
      if (wrapRef.current && event.target instanceof Node && !wrapRef.current.contains(event.target)) setOpenIndex(null);
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [openIndex]);

  const open = openIndex === null ? undefined : breakdown.tokens[openIndex];

  return (
    <div className={styles.breakdown} ref={wrapRef}>
      <div className={styles.rowWrap}>
        <div className={styles.row} role="group" aria-label="Word by word">
          {breakdown.tokens.map((token, index) => (
            <WordButton
              key={`${index}-${token.mi}`}
              token={token}
              open={openIndex === index}
              popoverId={popoverId}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              buttonRef={(node) => {
                buttons.current[index] = node;
              }}
            />
          ))}
        </div>
        {open && <Popover token={open} id={popoverId} onClose={() => setOpenIndex(null)} />}
      </div>
      {!compact && breakdown.literal && (
        <p className={styles.literal}>
          <span className={styles.label}>Literally:</span> {breakdown.literal}
        </p>
      )}
      {!compact && breakdown.note && <p className={styles.note}>{breakdown.note}</p>}
    </div>
  );
}

function useWide(): boolean {
  const query = '(min-width: 768px)';
  const [wide] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false));
  return wide;
}

/**
 * The breakdown behind a "Word by word" toggle: closed on phones, open on wide
 * screens. Used in answer feedback and the Glossary.
 */
export function BreakdownDisclosure({ breakdown, title = 'Word by word' }: { breakdown: BreakdownData | undefined; title?: string }) {
  const wide = useWide();
  const [open, setOpen] = useState(wide);
  if (!breakdown) return null;
  return (
    <details
      className={styles.disclosure}
      open={open}
      onToggle={(event) => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className={styles.summary}>{title}</summary>
      <Breakdown breakdown={breakdown} />
    </details>
  );
}

/** "What does this mean?" toggle for a unit's Māori title. */
export function TitleBreakdown({ unitId }: { unitId: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const breakdown = getTitleBreakdown(unitId);
  if (!breakdown) return null;
  return (
    <div className={styles.titleToggle}>
      <button type="button" className={styles.toggle} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        What does this mean?
      </button>
      {open && (
        <div id={id}>
          <Breakdown breakdown={breakdown} />
        </div>
      )}
    </div>
  );
}
