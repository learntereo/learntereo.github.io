import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import { useAuth } from '../../auth/AuthContext';
import { getUnit, grammarFor, itemsForUnit } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { saveQueue } from '../../data/saveQueue';
import { emptyUnitProgress, markLearned, saveUnitProgress } from '../../data/unitProgressRepo';
import { buildLearnCards, type LearnCard } from '../../game/learnDeck';
import { Breakdown } from '../components/Breakdown';
import { GrammarNote } from '../components/GrammarNote';
import { ItemImageView } from '../components/ItemImage';
import ui from '../components/ui.module.css';
import styles from './LearnDeck.module.css';

const SWIPE_DISTANCE = 50;

function WordCard({ card }: { card: Extract<LearnCard, { kind: 'word' }> }) {
  const { word, example } = card;
  return (
    <div className={styles.wordCard}>
      {word.image && (
        <div className={styles.picture}>
          <ItemImageView item={word} size="large" />
        </div>
      )}
      <p className={styles.mi} lang="mi">
        {word.mi}
      </p>
      <p className={styles.en}>{word.en[0]}</p>
      {word.en.length > 1 && <p className={styles.alt}>Also: {word.en.slice(1).join(', ')}</p>}
      {word.breakdown && (
        <div className={styles.breakdown}>
          <p className={styles.exampleLabel}>Word by word</p>
          <Breakdown breakdown={word.breakdown} />
        </div>
      )}
      {example && (
        <div className={styles.example}>
          <p className={styles.exampleLabel}>Example</p>
          <p className={styles.exampleMi} lang="mi">
            {example.mi}
          </p>
          <p className={styles.exampleEn}>{example.en[0]}</p>
          {example.breakdown && <Breakdown breakdown={example.breakdown} />}
        </div>
      )}
    </div>
  );
}

export function LearnDeck() {
  const { unitId } = useParams();
  const unit = getUnit(unitId);
  const { statuses } = useAppData();
  const status = unit ? statuses.get(unit.id) : undefined;
  if (!unit || !status || status.state === 'locked') return <Navigate to="/home" replace />;
  return <Deck key={unit.id} unitId={unit.id} />;
}

function Deck({ unitId }: { unitId: string }) {
  const { user } = useAuth();
  const { unitProgress, setUnitProgress } = useAppData();
  const unit = getUnit(unitId)!;
  const cards = useMemo(() => buildLearnCards(itemsForUnit(unit), grammarFor(unit)), [unit]);
  const [index, setIndex] = useState(0);
  const touchStart = useRef<number | null>(null);
  const savedRef = useRef(false);
  const card = cards[index];
  const last = cards.length - 1;

  // Reaching the final card means the learner has been through the whole deck.
  useEffect(() => {
    if (card.kind !== 'done' || savedRef.current || !user) return;
    savedRef.current = true;
    const existing = unitProgress.get(unit.id) ?? emptyUnitProgress(user.id, unit.id);
    if (existing.learned_at) return;
    const row = markLearned(existing, new Date().toISOString());
    setUnitProgress(row);
    void saveQueue.enqueue(`unit:${unit.id}`, () => saveUnitProgress(row));
  }, [card.kind, unit.id, unitProgress, user, setUnitProgress]);

  const go = (next: number) => setIndex(Math.max(0, Math.min(last, next)));

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') go(index + 1);
    if (event.key === 'ArrowLeft') go(index - 1);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStart.current = event.touches[0]?.clientX ?? null;
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    const end = event.changedTouches[0]?.clientX;
    if (start === null || end === undefined) return;
    const distance = end - start;
    if (distance <= -SWIPE_DISTANCE) go(index + 1);
    if (distance >= SWIPE_DISTANCE) go(index - 1);
  }

  const wordCount = cards.filter((c) => c.kind === 'word').length;
  const label =
    card.kind === 'word' ? `Word ${index + 1} of ${wordCount}` : card.kind === 'grammar' ? 'Grammar note' : 'All done';

  return (
    <main className={ui.page}>
      <div className={styles.top}>
        <Link to={`/unit/${unit.id}`} className={styles.exit}>
          Back to unit
        </Link>
        <span className={ui.muted}>{unit.title}</span>
      </div>

      <div
        className={ui.bar}
        role="progressbar"
        aria-label="Learn progress"
        aria-valuemin={0}
        aria-valuemax={cards.length}
        aria-valuenow={index + 1}
        aria-valuetext={`Card ${index + 1} of ${cards.length}`}
      >
        <div className={ui.barFill} style={{ width: `${((index + 1) / cards.length) * 100}%` }} />
      </div>
      <p className={styles.count} aria-live="polite">
        {label}
      </p>

      <div
        className={`${ui.card} ${styles.deck}`}
        tabIndex={0}
        role="group"
        aria-roledescription="carousel"
        aria-label={`${unit.title} cards. Use the arrow keys or the buttons to move.`}
        onKeyDown={onKeyDown}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {card.kind === 'word' && <WordCard card={card} />}
        {card.kind === 'grammar' && <GrammarNote markdown={card.markdown} />}
        {card.kind === 'done' && (
          <div className={styles.finish}>
            <h1 lang="mi">Kua oti!</h1>
            <p>
              You have met all {wordCount} words in <strong>{unit.title}</strong>. Next, practise them, then take the
              unit check.
            </p>
            <div className={ui.row}>
              <Link className={ui.button} to={`/unit/${unit.id}/practice`}>
                Start practice
              </Link>
              <Link className={`${ui.button} ${ui.secondary}`} to={`/unit/${unit.id}`}>
                Back to unit
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className={styles.nav}>
        <button type="button" className={`${ui.button} ${ui.secondary}`} onClick={() => go(index - 1)} disabled={index === 0}>
          Back
        </button>
        <button type="button" className={ui.button} onClick={() => go(index + 1)} disabled={index === last}>
          Next
        </button>
      </div>
    </main>
  );
}
