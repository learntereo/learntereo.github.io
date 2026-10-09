import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getItem } from '../../content/content';
import { insertAtCursor, isWriteCorrect, markWrite, writeNote } from '../../game/macronMarking';
import { ItemImageView } from '../components/ItemImage';
import ui from '../components/ui.module.css';
import { Feedback } from './Feedback';
import { MacronRow } from './MacronRow';
import { MSG_CORRECT, MSG_RETRY, type FeedbackMessage, type ModeProps } from './types';
import styles from './modes.module.css';

type Phase = 'asking' | 'correct' | 'revealed';

/** English to Māori. A missing macron is forgiven, with a reminder. */
export function Write({ question, onDone }: ModeProps) {
  const item = getItem(question.itemIds[0])!;
  const [input, setInput] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('asking');
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const continueRef = useRef<HTMLButtonElement>(null);
  const pendingCursor = useRef<number | null>(null);

  useEffect(() => {
    if (phase !== 'asking') continueRef.current?.focus();
  }, [phase]);

  // Put the cursor back after the inserted macron once React has updated the value.
  useEffect(() => {
    const cursor = pendingCursor.current;
    if (cursor === null) return;
    pendingCursor.current = null;
    inputRef.current?.setSelectionRange(cursor, cursor);
  }, [input]);

  function insert(letter: string) {
    const el = inputRef.current;
    if (!el || phase !== 'asking') return;
    const next = insertAtCursor(input, el.selectionStart, el.selectionEnd, letter);
    pendingCursor.current = next.cursor;
    setInput(next.value);
    el.focus();
  }

  function handleCheck(event: FormEvent) {
    event.preventDefault();
    if (phase !== 'asking' || input.trim() === '') return;

    const verdict = markWrite(input, item.mi);
    if (isWriteCorrect(verdict)) {
      setPhase('correct');
      const note = writeNote(verdict, item.mi);
      setMessage(note ? { kind: 'info', text: note } : { kind: 'correct', text: MSG_CORRECT });
      return;
    }
    if (wrongCount === 0) {
      setWrongCount(1);
      setMessage({ kind: 'wrong', text: MSG_RETRY });
    } else {
      setWrongCount(2);
      setPhase('revealed');
      setMessage({ kind: 'wrong', text: `The answer is: ${item.mi}` });
    }
  }

  function handleContinue() {
    const correct = phase === 'correct';
    onDone({
      result: !correct ? 'missed' : wrongCount === 0 ? 'first' : 'retry',
      requeued: question.requeued,
      items: [{ itemId: item.id, correct }],
    });
  }

  return (
    <div className={styles.question}>
      <p className={ui.muted}>Write this in Māori:</p>
      {item.kind === 'word' && item.image && <ItemImageView item={item} size="large" />}
      <p className={styles.prompt}>{item.en[0]}</p>

      <form className={styles.form} onSubmit={handleCheck}>
        <label className={ui.visuallyHidden} htmlFor="write-input">
          Your Māori answer
        </label>
        <input
          id="write-input"
          ref={inputRef}
          className={styles.input}
          lang="mi"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={phase !== 'asking'}
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
        />
        {phase === 'asking' && <MacronRow onInsert={insert} />}
        {phase === 'asking' && (
          <button type="submit" className={ui.button} disabled={input.trim() === ''}>
            Check
          </button>
        )}
      </form>

      <Feedback message={message} />

      {phase !== 'asking' && (
        <button type="button" ref={continueRef} className={ui.button} onClick={handleContinue}>
          Continue
        </button>
      )}
    </div>
  );
}
