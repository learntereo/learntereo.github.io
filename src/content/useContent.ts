import { useEffect, useState } from 'react';
import type { Level } from '../game/types';
import { isLevelLoaded, loadLevels } from './content';

/**
 * Loads the words and grammar notes of the given levels. `ready` turns true
 * once they are all in; `failed` is true if the download did not work.
 */
export function useContentLevels(levels: readonly Level[]): { ready: boolean; failed: boolean; retry: () => void } {
  const key = levels.join(',');
  const [, setTick] = useState(0);
  const [failedKey, setFailedKey] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (levels.every(isLevelLoaded)) return;
    let cancelled = false;
    loadLevels(levels)
      .then(() => {
        if (!cancelled) setTick((t) => t + 1);
      })
      .catch((error) => {
        console.error('Could not load lessons', error);
        if (!cancelled) setFailedKey(`${key}#${attempt}`);
      });
    return () => {
      cancelled = true;
    };
    // `levels` is represented by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  return {
    ready: levels.every(isLevelLoaded),
    failed: failedKey === `${key}#${attempt}`,
    retry: () => setAttempt((a) => a + 1),
  };
}
