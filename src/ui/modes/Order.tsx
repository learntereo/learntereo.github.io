import {
  DndContext,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, type ReactNode } from 'react';
import { getItem } from '../../content/content';
import { capitaliseFirst, sentenceFromTiles } from '../../game/display';
import { buildBank, checkOrder, type BankTile } from '../../game/orderCheck';
import { createRng, randomSeed } from '../../game/rng';
import type { SentenceItem } from '../../game/types';
import ui from '../components/ui.module.css';
import { useDragSensors } from './dnd';
import { BreakdownDisclosure } from '../components/Breakdown';
import { Feedback } from './Feedback';
import { MSG_CORRECT, MSG_RETRY, type FeedbackMessage, type ModeProps } from './types';
import styles from './modes.module.css';

const ROW = 'row';
const BANK = 'bank';

/** Prefer a tile under the pointer (to insert at its position), else the row or bank itself. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const candidates = hits.length > 0 ? hits : rectIntersection(args);
  const tile = candidates.find((c) => c.id !== ROW && c.id !== BANK);
  if (tile) return [tile];
  return candidates.length > 0 ? [candidates[0]] : [];
};

function DropZone({ id, className, children, label }: { id: string; className: string; children: ReactNode; label: string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? styles.over : ''}`} role="group" aria-label={label}>
      {children}
    </div>
  );
}

interface TileViewProps {
  tile: BankTile;
  /** Show the first letter in capitals (the first word of the answer). Display only. */
  capital?: boolean;
  locked: boolean;
  onTap: () => void;
}

function RowTile({ tile, locked, onTap, capital }: TileViewProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.id,
    disabled: locked,
  });
  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`${styles.tile} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onTap}
      aria-label={`${tile.text}, in your answer. Press Enter to remove it, or Space to move it.`}
      {...attributes}
      {...listeners}
    >
      <span lang="mi">{capital ? capitaliseFirst(tile.text) : tile.text}</span>
    </button>
  );
}

function BankTileView({ tile, locked, onTap }: TileViewProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: tile.id, disabled: locked });
  return (
    <button
      type="button"
      ref={setNodeRef}
      className={`${styles.tile} ${isDragging ? styles.dragging : ''}`}
      style={{ transform: CSS.Translate.toString(transform) }}
      onClick={onTap}
      aria-label={`${tile.text}. Press Enter to add it to your answer, or Space to drag it.`}
      {...attributes}
      {...listeners}
    >
      <span lang="mi">{tile.text}</span>
    </button>
  );
}

export function Order({ question, onDone }: ModeProps) {
  const sentence = getItem(question.itemIds[0]) as SentenceItem;
  const [bank] = useState(() => buildBank(sentence.tiles, question.decoys ?? [], createRng(randomSeed())));
  const [rowIds, setRowIds] = useState<string[]>([]);
  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<'asking' | 'correct' | 'revealed'>('asking');
  const [message, setMessage] = useState<FeedbackMessage | null>(null);

  const sensors = useDragSensors(true);
  const byId = new Map(bank.map((t) => [t.id, t]));
  const locked = phase !== 'asking';
  const bankTiles = bank.filter((t) => !rowIds.includes(t.id));

  function moveToRow(id: string, index?: number) {
    setRowIds((current) => {
      const without = current.filter((x) => x !== id);
      const at = index === undefined ? without.length : Math.min(index, without.length);
      return [...without.slice(0, at), id, ...without.slice(at)];
    });
  }

  function moveToBank(id: string) {
    setRowIds((current) => current.filter((x) => x !== id));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || locked) return;
    const id = String(active.id);
    const overId = String(over.id);
    const inRow = rowIds.includes(id);

    if (overId === BANK) {
      if (inRow) moveToBank(id);
    } else if (overId === ROW) {
      moveToRow(id);
    } else if (rowIds.includes(overId)) {
      const overIndex = rowIds.indexOf(overId);
      if (inRow) setRowIds(arrayMove(rowIds, rowIds.indexOf(id), overIndex));
      else moveToRow(id, overIndex);
    }
  }

  function handleCheck() {
    if (locked || rowIds.length === 0) return;
    const answer = rowIds.map((id) => byId.get(id)!.text);
    if (checkOrder(answer, sentence)) {
      setPhase('correct');
      setMessage({ kind: 'correct', text: MSG_CORRECT });
    } else if (wrongCount === 0) {
      setWrongCount(1);
      setMessage({ kind: 'wrong', text: MSG_RETRY });
    } else {
      setWrongCount(2);
      setPhase('revealed');
      setMessage({ kind: 'wrong', text: `The correct order is: ${sentenceFromTiles(sentence.tiles)}` });
    }
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
      <p className={ui.muted}>Put the Māori words in order to say:</p>
      <p className={styles.prompt}>{sentence.en[0]}</p>

      <DndContext sensors={sensors} collisionDetection={collision} onDragEnd={handleDragEnd}>
        <DropZone id={ROW} className={styles.answerRow} label="Your answer">
          <SortableContext items={rowIds} strategy={rectSortingStrategy}>
            {rowIds.map((id, index) => (
              <RowTile key={id} tile={byId.get(id)!} capital={index === 0} locked={locked} onTap={() => !locked && moveToBank(id)} />
            ))}
          </SortableContext>
          {rowIds.length === 0 && <span className={styles.rowHint}>Drag or tap words here</span>}
        </DropZone>

        <DropZone id={BANK} className={styles.bank} label="Word bank">
          {bankTiles.map((tile) => (
            <BankTileView key={tile.id} tile={tile} locked={locked} onTap={() => !locked && moveToRow(tile.id)} />
          ))}
        </DropZone>
      </DndContext>

      <p className={ui.muted}>
        Tap a word to move it, or drag it. There are extra words that do not belong.
      </p>

      <Feedback message={message} />
      {phase !== 'asking' && <BreakdownDisclosure breakdown={sentence.breakdown} />}

      {phase === 'asking' ? (
        <button type="button" className={ui.button} onClick={handleCheck} disabled={rowIds.length === 0}>
          Check
        </button>
      ) : (
        <button type="button" className={ui.button} onClick={handleContinue} autoFocus>
          Continue
        </button>
      )}
    </div>
  );
}
