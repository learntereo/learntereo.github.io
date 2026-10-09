import type { Level, Outcome, Question } from '../../game/types';

/** Props shared by every question component. Each is remounted per question (keyed by index). */
export interface ModeProps {
  question: Question;
  level: Level;
  onDone: (outcome: Outcome) => void;
}

export interface FeedbackMessage {
  kind: 'correct' | 'wrong' | 'info';
  text: string;
}

export const MSG_CORRECT = 'Ka pai!';
export const MSG_RETRY = 'Not quite, try again';
