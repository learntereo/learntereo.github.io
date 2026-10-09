import { Link, Navigate, useParams } from 'react-router';
import { getUnit, grammarFor, sentencesForUnit, units, wordsForUnit } from '../../content/content';
import { useAppData } from '../../data/AppDataContext';
import { treasureAfter, treasureSlots } from '../../game/treasures';
import { CHECK_SIZE, passMark } from '../../game/unitRound';
import { BreakdownDisclosure, TitleBreakdown } from '../components/Breakdown';
import { FactCard } from '../components/FactCard';
import { GrammarNote } from '../components/GrammarNote';
import { ItemImageView } from '../components/ItemImage';
import { TreasureIcon } from '../components/Treasure';
import { TreasureButton } from '../components/TreasureButton';
import ui from '../components/ui.module.css';
import { LEVEL_LABEL } from '../labels';
import styles from './UnitScreen.module.css';

const SLOTS = treasureSlots(units);

export function UnitScreen() {
  const { unitId } = useParams();
  const { statuses } = useAppData();
  const unit = getUnit(unitId);
  const status = unit ? statuses.get(unit.id) : undefined;
  if (!unit || !status || status.state === 'locked') return <Navigate to="/home" replace />;

  const words = wordsForUnit(unit);
  const sentences = sentencesForUnit(unit);
  const grammar = grammarFor(unit);
  const percent = status.itemsTotal === 0 ? 0 : Math.round((status.itemsLearned / status.itemsTotal) * 100);
  const complete = status.state === 'complete';
  const slot = treasureAfter(unit.id, SLOTS);

  return (
    <main className={ui.page}>
      <div>
        <Link to="/home" className={styles.back}>
          &larr; Path
        </Link>
        <p className={styles.level}>{LEVEL_LABEL[unit.level]} &middot; Unit {unit.order}</p>
        <h1 className={styles.title}>
          <span aria-hidden="true">{unit.emoji} </span>
          {unit.title}
        </h1>
        <p className={styles.titleMi} lang="mi">
          {unit.titleMi}
        </p>
        <TitleBreakdown unitId={unit.id} />
      </div>

      <section className={ui.card} aria-label="Your progress in this unit">
        <p className={styles.statusLine}>
          {complete ? (
            <strong className={styles.done}>Complete</strong>
          ) : (
            <strong>{status.itemsLearned > 0 || status.deckDone ? 'In progress' : 'Not started'}</strong>
          )}
          {status.bestScore !== null && (
            <span className={ui.muted}>
              {' '}
              &middot; Best Kiwiz {status.bestScore} / {CHECK_SIZE}
            </span>
          )}
        </p>
        <p className={ui.muted}>
          <strong>{status.itemsLearned}</strong> / {status.itemsTotal} items learned
        </p>
        <div
          className={ui.bar}
          role="progressbar"
          aria-label={`${unit.title} progress`}
          aria-valuemin={0}
          aria-valuemax={status.itemsTotal}
          aria-valuenow={status.itemsLearned}
        >
          <div className={ui.barFill} style={{ width: `${percent}%` }} />
        </div>
      </section>

      {slot && (
        <section className={`${ui.card} ${styles.treasure}`} aria-label="Kiwiana treasure for this unit">
          {complete ? (
            <TreasureButton treasure={slot.treasure} size={48} className={styles.treasureButton} />
          ) : (
            <TreasureIcon id={slot.treasure.id} size={48} locked />
          )}
          <p>
            {complete ? (
              <>
                <strong>{slot.treasure.name}</strong> is in your Kiwiana. <Link to="/kiwiana">See your Kiwiana</Link>
              </>
            ) : (
              <>
                Finish this unit to unlock a kiwiana treasure. <Link to="/kiwiana">See your Kiwiana</Link>
              </>
            )}
          </p>
        </section>
      )}

      {complete && <FactCard unitId={unit.id} />}

      <ol className={styles.steps}>
        <li className={`${ui.card} ${styles.step}`}>
          <h2>1. Learn</h2>
          <Link className={`${ui.button} ${status.deckDone ? ui.secondary : ''}`} to={`/unit/${unit.id}/learn`}>
            {status.deckDone ? 'Learn again' : 'Learn'}
          </Link>
        </li>
        <li className={`${ui.card} ${styles.step}`}>
          <h2>2. Practice</h2>
          <Link className={`${ui.button} ${ui.secondary}`} to={`/unit/${unit.id}/practice`}>
            Practise
          </Link>
        </li>
        <li className={`${ui.card} ${styles.step}`}>
          <h2>3. Kiwiz</h2>
          <p className={ui.muted}>
            {passMark(CHECK_SIZE)} of {CHECK_SIZE} to pass
          </p>
          {status.deckDone ? (
            <Link className={ui.button} to={`/unit/${unit.id}/check`}>
              {status.attempts > 0 ? 'Take the Kiwiz again' : 'Take the Kiwiz'}
            </Link>
          ) : (
            <>
              <button type="button" className={ui.button} disabled aria-describedby={`${unit.id}-check-note`}>
                Take the Kiwiz
              </button>
              <p id={`${unit.id}-check-note`} className={styles.note}>
                Finish Learn first.
              </p>
            </>
          )}
        </li>
      </ol>

      {grammar && (
        <details className={ui.card}>
          <summary className={styles.summary}>Grammar note</summary>
          <GrammarNote markdown={grammar} />
        </details>
      )}

      <section className={ui.card} aria-labelledby="words-title">
        <h2 id="words-title">Words ({words.length})</h2>
        <ul className={styles.words}>
          {words.map((word) => (
            <li key={word.id} className={styles.word}>
              <span className={styles.wordImage}>
                <ItemImageView item={word} />
              </span>
              <span lang="mi" className={styles.wordMi}>
                {word.mi}
              </span>
              <span className={ui.muted}>{word.en[0]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={ui.card} aria-labelledby="sentences-title">
        <h2 id="sentences-title">Sentences ({sentences.length})</h2>
        <ul className={styles.sentences}>
          {sentences.map((sentence) => (
            <li key={sentence.id}>
              <span lang="mi" className={styles.wordMi}>
                {sentence.mi}
              </span>
              <br />
              <span className={ui.muted}>{sentence.en[0]}</span>
              <BreakdownDisclosure breakdown={sentence.breakdown} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
