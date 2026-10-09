import { useEffect, useState } from 'react';

/** One entry of the little words dictionary (particles.json). */
export interface Particle {
  id: string;
  /** Spellings, e.g. "tēnei", "tēnā", "tērā". */
  forms: string[];
  /** Short gloss. */
  gloss: string;
  /** Two to four sentences of plain English. */
  explanation: string;
  example: { mi: string; en: string };
}

let cache: Particle[] | null = null;
let pending: Promise<Particle[]> | null = null;

/**
 * The dictionary is loaded on demand (it is only needed once a learner taps a
 * word or opens Little words), so it stays out of the main bundle.
 */
export function loadParticles(): Promise<Particle[]> {
  if (cache) return Promise.resolve(cache);
  pending ??= import('./particles.json').then((m) => {
    cache = m.default as Particle[];
    return cache;
  });
  return pending;
}

/** The loaded dictionary, or null while it is downloading. */
export function useParticles(enabled = true): readonly Particle[] | null {
  const [particles, setParticles] = useState<readonly Particle[] | null>(cache);
  useEffect(() => {
    if (!enabled || cache) return;
    let cancelled = false;
    loadParticles()
      .then((list) => {
        if (!cancelled) setParticles(list);
      })
      .catch((error) => console.error('Could not load the little words', error));
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return particles ?? cache;
}
