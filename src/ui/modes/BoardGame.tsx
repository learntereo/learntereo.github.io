import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useMemo, useState } from 'react';
import { getItem } from '../../content/content';
import { boardResult, shouldReveal } from '../../game/boardResult';
import { createRng, randomSeed, shuffle } from '../../game/rng';
import type { WordItem } from '../../game/types';
import { ItemImageView } from '../components/ItemImage';
import ui from '../components/ui.module.css';
import { useDragSensors } from './dnd';
import { Feedback } from './Feedback';
import { MSG_CORRECT, MSG_RETRY, type FeedbackMessage, type ModeProps } from './types';
import styles from './modes.module.css';

const CHIP = 'chip:';
const TARGET = 'target:';

interface ChipProps {
  word: WordItem;
  locked: boolean;
  disabled: boolean;
  shaking: boolean;
  selected: boolean;
  onTap: () => void;
}

function Chip({ word, locked, disabled, shaking, selected, onTap }: ChipProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: CHIP + word.id,
    disabled: locked || disabled,
  });

  if (locked) return <div className={`${styles.chip} ${styles.placeholder}`} aria-hidden="true" />;

  const className = [
    styles.chip,
    isDragging ? styles.dragging : '',
    shaking ? styles.shake : '',
    selected ? styles.selected : '',
  ].join(' ');

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={className}
      style={{ transform: CSS.Translate.toString(transform) }}
      onClick={onTap}
      {...attributes}
      {...listeners}
      aria-pressed={selected}
    >
      <span lang="mi">{word.mi}</span>
    </button>
  );
}

interface TargetProps {
  word: WordItem;
  variant: 'match' | 'picture';
  placed: boolean;
  highlighted: boolean;
  hint: string | null;
  onTap: () => void;
}

function Target({ word, variant, placed, highlighted, hint, onTap }: TargetProps) {
  const { setNodeRef, isOver } = useDroppable({ id: TARGET + word.id, disabled: placed });
  const className = [
    styles.target,
    variant === 'picture' ? styles.pictureTarget : '',
    isOver ? styles.over : '',
    placed ? styles.placed : '',
    highlighted ? styles.highlight : '',
  ].join(' ');

  const label = variant === 'picture' ? <ItemImageView item={word} size="large" /> : <span>{word.en[0]}</span>;

  return (
    <button
      type="button"
      ref={setNodeRef}
      className={className}
      onClick={onTap}
      aria-label={
        placed ? `${word.mi}, ${word.en[0]}, matched` : `Drop target: ${word.en[0]}${highlighted ? ' (correct spot)' : ''}`
      }
    >
      {label}
      {placed && (
        <span className={styles.filled} lang="mi">
          {word.mi}
        </span>
      )}
      {hint && (
        <span className={styles.hint}>
          Here: <span lang="mi">{hint}</span>
        </span>
      )}
    </button>
  );
}

/** Match (5 Māori words onto English) and Picture (4 words onto pictures) share this board. */
export function BoardGame({ question, onDone, hints = true }: ModeProps) {
  const variant = question.mode === 'picture' ? 'picture' : 'match';
  const words = useMemo(() => question.itemIds.map((id) => getItem(id) as WordItem), [question]);
  const [chipOrder] = useState(() => shuffle(words, createRng(randomSeed())));
  const [targetOrder] = useState(() => shuffle(words, createRng(randomSeed())));

  const [placed, setPlaced] = useState<readonly string[]>([]);
  const [wrong, setWrong] = useState<Record<string, number>>({});
  const [revealed, setRevealed] = useState<readonly string[]>([]);
  const [shaking, setShaking] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const sensors = useDragSensors();
  const done = placed.length === words.length;

  function attempt(chipId: string, targetId: string) {
    if (done || placed.includes(chipId) || placed.includes(targetId)) return;
    setSelected(null);

    if (chipId === targetId) {
      setPlaced([...placed, chipId]);
      const wasRevealed = revealed.includes(chipId);
      setMessage(wasRevealed ? { kind: 'info', text: 'That one counts as a miss. Keep going.' } : { kind: 'correct', text: MSG_CORRECT });
      return;
    }

    const count = (wrong[chipId] ?? 0) + 1;
    setWrong({ ...wrong, [chipId]: count });
    setShaking(chipId);
    window.setTimeout(() => setShaking((current) => (current === chipId ? null : current)), 450);
    if (shouldReveal(count)) {
      if (!revealed.includes(chipId)) setRevealed([...revealed, chipId]);
      setMessage({
        kind: 'wrong',
        text: hints ? 'Not quite. The right spot is highlighted, drop it there.' : 'Not quite. Keep trying.',
      });
    } else {
      setMessage({ kind: 'wrong', text: MSG_RETRY });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const chipId = String(active.id);
    const targetId = String(over.id);
    if (!chipId.startsWith(CHIP) || !targetId.startsWith(TARGET)) return;
    attempt(chipId.slice(CHIP.length), targetId.slice(TARGET.length));
  }

  function handleContinue() {
    onDone({
      result: boardResult(wrong, revealed),
      requeued: question.requeued,
      items: words.map((w) => ({ itemId: w.id, correct: !revealed.includes(w.id) })),
    });
  }

  const prompt =
    variant === 'match'
      ? 'Drag each Māori word onto its English meaning. You can also tap a word, then tap its meaning.'
      : 'Drag each Māori word onto its picture. You can also tap a word, then tap its picture.';

  const chips = (
    <div className={styles.chips}>
      {chipOrder.map((word) => (
        <Chip
          key={word.id}
          word={word}
          locked={placed.includes(word.id)}
          disabled={done}
          shaking={shaking === word.id}
          selected={selected === word.id}
          onTap={() => setSelected((current) => (current === word.id ? null : word.id))}
        />
      ))}
    </div>
  );

  const targets = (
    <div className={variant === 'picture' ? styles.pictureGrid : styles.targets}>
      {targetOrder.map((word) => {
        const isRevealed = hints && revealed.includes(word.id) && !placed.includes(word.id);
        return (
          <Target
            key={word.id}
            word={word}
            variant={variant}
            placed={placed.includes(word.id)}
            highlighted={isRevealed}
            hint={isRevealed ? word.mi : null}
            onTap={() => selected && attempt(selected, word.id)}
          />
        );
      })}
    </div>
  );

  return (
    <div className={styles.question}>
      <p className={ui.muted}>{prompt}</p>
      <DndContext sensors={sensors} onDragStart={() => setSelected(null)} onDragEnd={handleDragEnd}>
        {variant === 'match' ? (
          <div className={styles.matchBoard}>
            {chips}
            {targets}
          </div>
        ) : (
          <div className={styles.pictureBoard}>
            {targets}
            {chips}
          </div>
        )}
      </DndContext>

      <Feedback message={message} />

      {done && (
        <button type="button" className={ui.button} onClick={handleContinue} autoFocus>
          Continue
        </button>
      )}
    </div>
  );
}
