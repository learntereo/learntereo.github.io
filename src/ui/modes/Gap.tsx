import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useRef, useState } from 'react';
import { getItem } from '../../content/content';
import { capitaliseFirst } from '../../game/display';
import type { SentenceItem } from '../../game/types';
import ui from '../components/ui.module.css';
import { useDragSensors } from './dnd';
import { BreakdownDisclosure } from '../components/Breakdown';
import { Feedback } from './Feedback';
import { MSG_CORRECT, MSG_RETRY, type FeedbackMessage, type ModeProps } from './types';
import styles from './modes.module.css';

const GAP = 'gap';
const OPTION = 'option:';

function Option({
  text,
  label,
  disabled,
  shaking,
  onTap,
}: {
  text: string;
  label: string;
  disabled: boolean;
  shaking: boolean;
  onTap: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: OPTION + text, disabled });
  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`${styles.chip} ${isDragging ? styles.dragging : ''} ${shaking ? styles.shake : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      onClick={onTap}
      disabled={disabled}
      {...attributes}
      {...listeners}
    >
      <span lang="mi">{label}</span>
    </button>
  );
}

function GapSlot({ filled, state }: { filled: string | null; state: 'empty' | 'correct' | 'revealed' }) {
  const { setNodeRef, isOver } = useDroppable({ id: GAP, disabled: state !== 'empty' });
  const className = [
    styles.gapSlot,
    isOver ? styles.over : '',
    state === 'correct' ? styles.placed : '',
    state === 'revealed' ? styles.highlight : '',
  ].join(' ');
  return (
    <span ref={setNodeRef} className={className} role="group" aria-label={filled ? `Gap: ${filled}` : 'Gap'}>
      {filled ? <span lang="mi">{filled}</span> : <span aria-hidden="true">&nbsp;</span>}
    </span>
  );
}

/** One word of a Māori sentence is missing. Drag or tap the right word. */
export function Gap({ question, onDone }: ModeProps) {
  const sentence = getItem(question.itemIds[0]) as SentenceItem;
  const gapIndex = question.gapIndex ?? 0;
  const answer = sentence.tiles[gapIndex];
  const options = question.options ?? [answer];

  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<'asking' | 'correct' | 'revealed'>('asking');
  const [shaking, setShaking] = useState<string | null>(null);
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const sensors = useDragSensors();
  const shakeTimer = useRef<number | undefined>(undefined);
  const asking = phase === 'asking';

  function attempt(choice: string) {
    if (!asking) return;
    if (choice === answer) {
      setPhase('correct');
      setMessage({ kind: 'correct', text: MSG_CORRECT });
      return;
    }
    setShaking(choice);
    window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShaking(null), 450);
    if (wrongCount === 0) {
      setWrongCount(1);
      setMessage({ kind: 'wrong', text: MSG_RETRY });
    } else {
      setWrongCount(2);
      setPhase('revealed');
      setMessage({ kind: 'wrong', text: `The missing word is: ${answer}` });
    }
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || over.id !== GAP) return;
    const id = String(active.id);
    if (id.startsWith(OPTION)) attempt(id.slice(OPTION.length));
  }

  function handleContinue() {
    const correct = phase === 'correct';
    onDone({
      result: !correct ? 'missed' : wrongCount === 0 ? 'first' : 'retry',
      requeued: question.requeued,
      items: [{ itemId: sentence.id, correct }],
    });
  }

  return (
    <div className={styles.question}>
      <p className={ui.muted}>Fill the gap to say:</p>
      <p className={styles.prompt}>{sentence.en[0]}</p>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <p className={styles.gapSentence} lang="mi">
          {sentence.tiles.map((tile, i) =>
            i === gapIndex ? (
              <GapSlot
                key={i}
                filled={asking ? null : i === 0 ? capitaliseFirst(answer) : answer}
                state={asking ? 'empty' : phase}
              />
            ) : (
              <span key={i} className={styles.gapWord}>
                {i === 0 ? capitaliseFirst(tile) : tile}
              </span>
            ),
          )}
        </p>

        <div className={styles.gapOptions} role="group" aria-label="Choose the missing word">
          {options.map((text) => (
            <Option key={text} text={text} label={gapIndex === 0 ? capitaliseFirst(text) : text} disabled={!asking} shaking={shaking === text} onTap={() => attempt(text)} />
          ))}
        </div>
      </DndContext>

      <p className={ui.muted}>Drag a word into the gap, or tap it.</p>

      <Feedback message={message} />
      {!asking && <BreakdownDisclosure breakdown={sentence.breakdown} />}

      {!asking && (
        <button type="button" className={ui.button} onClick={handleContinue} autoFocus>
          Continue
        </button>
      )}
    </div>
  );
}
