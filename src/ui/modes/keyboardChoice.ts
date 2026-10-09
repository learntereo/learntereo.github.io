import { useState } from 'react';

/** Māori alphabet order: the vowels and consonants, ng and wh as single keys, then the macron vowels. */
export const LETTER_KEYS: readonly string[] = ['a', 'e', 'h', 'i', 'k', 'm', 'n', 'o', 'p', 'r', 't', 'u', 'w', 'ng', 'wh'];
export const MACRON_KEYS: readonly string[] = ['ā', 'ē', 'ī', 'ō', 'ū'];

const STORAGE_KEY = 'ako.usePhoneKeyboard';

function readChoice(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeChoice(value: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
  } catch {
    // Storage can be blocked (private windows); the choice just is not remembered.
  }
}

function isTouchDevice(): boolean {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  } catch {
    return false;
  }
}

/**
 * Whether to let the phone's own keyboard open. Off by default, so tapping the
 * answer box on a touch device does not cover the on-screen keys.
 */
export function useKeyboardChoice() {
  const [touch] = useState(isTouchDevice);
  const [usePhoneKeyboard, setChoice] = useState(readChoice);
  return {
    touch,
    usePhoneKeyboard,
    /** True when the input should accept the native keyboard (inputMode text). */
    nativeKeyboard: !touch || usePhoneKeyboard,
    setUsePhoneKeyboard(value: boolean) {
      setChoice(value);
      writeChoice(value);
    },
  };
}

