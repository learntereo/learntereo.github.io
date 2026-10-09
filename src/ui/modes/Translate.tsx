import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getItem } from '../../content/content';
import { isAnswerCorrect } from '../../game/marking';
import ui from '../components/ui.module.css';
import { BreakdownDisclosure } from '../components/Breakdown';
import { Feedback } from './Feedback';
import { MSG_CORRECT, MSG_RETRY, type FeedbackMessage, type ModeProps } from './types';
import styles from './modes.module.css';

type Phase = 'asking' | 'correct' | 'revealed';

export function Translate({ question, onDone }: ModeProps) {
  const item = getItem(question.itemIds[0])!;
  const [input, setInput] = useState('');
  const [wrongCount, setWrongCount] = useState(0);
  const [phase, setPhase] = useState<Phase>('asking');
  const [message, setMessage] = useState<FeedbackMessage | null>(null);
  const continueRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (phase !== 'asking') continueRef.current?.focus();
  }, [phase]);

  function handleCheck(event: FormEvent) {
    event.preventDefault();
    if (phase !== 'asking' || input.trim() === '') return;

    if (isAnswerCorrect(input, item.en)) {
      setPhase('correct');
      setMessage({ kind: 'correct', text: MSG_CORRECT });
      return;
    }
    if (wrongCount === 0) {
      setWrongCount(1);
      setMessage({ kind: 'wrong', text: MSG_RETRY });
    } else {
      setWrongCount(2);
      setPhase('revealed');
      setMessage({ kind: 'wrong', text: `The answer is: ${item.en[0]}` });
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
      <p className={ui.muted}>Type the English for:</p>
      <p className={styles.prompt} lang="mi">
        {item.mi}
      </p>

      <form className={styles.form} onSubmit={handleCheck}>
        <label className={ui.visuallyHidden} htmlFor="translate-input">
          Your English answer
        </label>
        <input
          id="translate-input"
          className={styles.input}
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
        {phase === 'asking' && (
          <button type="submit" className={ui.button} disabled={input.trim() === ''}>
            Check
          </button>
        )}
      </form>

      <Feedback message={message} />
      {phase !== 'asking' && <BreakdownDisclosure breakdown={item.breakdown} />}

      {phase !== 'asking' && (
        <button type="button" ref={continueRef} className={ui.button} onClick={handleContinue}>
          Continue
        </button>
      )}
    </div>
  );
}
