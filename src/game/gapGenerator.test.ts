import { describe, expect, it } from 'vitest';
import { sentencesForLevel } from '../content/content';
import { GAP_OPTIONS, buildGap, interchangeable } from './gapGenerator';
import { createRng } from './rng';
import type { SentenceItem } from './types';

const sentence = (id: string, tiles: string[], decoys: string[] = []): SentenceItem => ({
  id,
  kind: 'sentence',
  level: 'beginner',
  mi: tiles.join(' '),
  en: ['x'],
  tiles,
  decoys,
});

const pool = [
  sentence('a', ['kei', 'te', 'kai', 'ahau', 'i', 'te', 'āporo']),
  sentence('b', ['he', 'kurī', 'tēnei']),
  sentence('c', ['he', 'ngeru', 'tērā']),
  sentence('d', ['kei', 'hea', 'te', 'wharepaku']),
  sentence('e', ['ko', 'Mere', 'tōku', 'ingoa'], ['taku']),
  sentence('f', ['e', 'rima', 'ngā', 'manu']),
];

describe('buildGap', () => {
  it('blanks a tile and offers it among 4 distinct options (AC8)', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = pool[seed % pool.length];
      const gap = buildGap(s, pool, createRng(seed));
      expect(gap.gapIndex).toBeGreaterThanOrEqual(0);
      expect(gap.gapIndex).toBeLessThan(s.tiles.length);
      expect(gap.options).toHaveLength(GAP_OPTIONS);
      expect(new Set(gap.options).size).toBe(GAP_OPTIONS);
      expect(gap.options).toContain(s.tiles[gap.gapIndex]);
    }
  });

  it('never offers another tile of the sentence as a distractor', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const s = pool[seed % pool.length];
      const gap = buildGap(s, pool, createRng(seed));
      const answer = s.tiles[gap.gapIndex];
      for (const option of gap.options.filter((o) => o !== answer)) expect(s.tiles).not.toContain(option);
    }
  });

  it('gives a blanked particle particle distractors from its own group when it can', () => {
    const s = sentence('g', ['kei', 'te', 'kai', 'ahau']);
    let checked = 0;
    for (let seed = 1; seed <= 200 && checked < 5; seed++) {
      const gap = buildGap(s, pool, createRng(seed));
      if (s.tiles[gap.gapIndex] !== 'kei') continue;
      checked++;
      const others = gap.options.filter((o) => o !== 'kei');
      expect(others.every((o) => ['i', 'ka', 'e', 'ana', 'ki'].includes(o))).toBe(true);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('gives a blanked content word content-word distractors', () => {
    const s = sentence('h', ['he', 'kurī', 'tēnei']);
    const particles = new Set(['te', 'ngā', 'he', 'ko', 'kei', 'i', 'ka', 'e', 'ana', 'ki', 'tēnā', 'tērā', 'tēnei']);
    let checked = 0;
    for (let seed = 1; seed <= 200 && checked < 5; seed++) {
      const gap = buildGap(s, pool, createRng(seed));
      if (s.tiles[gap.gapIndex] !== 'kurī') continue;
      checked++;
      expect(gap.options.filter((o) => o !== 'kurī').every((o) => !particles.has(o))).toBe(true);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it('never offers tēnā next to tērā, which would both be right', () => {
    const s = sentence('i', ['he', 'kurī', 'tēnā']);
    for (let seed = 1; seed <= 100; seed++) {
      const gap = buildGap(s, pool, createRng(seed));
      if (s.tiles[gap.gapIndex] === 'tēnā') expect(gap.options).not.toContain('tērā');
    }
  });

  it('is deterministic for a seed', () => {
    expect(buildGap(pool[0], pool, createRng(5))).toEqual(buildGap(pool[0], pool, createRng(5)));
  });

  it('works for every real sentence', () => {
    for (const level of ['beginner', 'intermediate'] as const) {
      const sentences = sentencesForLevel(level);
      for (const s of sentences) {
        const gap = buildGap(s, sentences, createRng(3));
        expect(gap.options.length).toBeGreaterThanOrEqual(3);
        expect(gap.options).toContain(s.tiles[gap.gapIndex]);
      }
    }
  });
});

describe('interchangeable words', () => {
  it('treats the neutral possessive as fitting every A and O form of the same person and number', () => {
    for (const [neutral, a, o] of [
      ['taku', 'tāku', 'tōku'],
      ['aku', 'āku', 'ōku'],
      ['tō', 'tāu', 'tōu'],
      ['ō', 'āu', 'ōu'],
      ['tana', 'tāna', 'tōna'],
      ['ana', 'āna', 'ōna'],
    ]) {
      expect(interchangeable(neutral, a)).toBe(true);
      expect(interchangeable(a, neutral)).toBe(true);
      expect(interchangeable(neutral, o)).toBe(true);
      expect(interchangeable(o, neutral)).toBe(true);
    }
  });

  it('keeps A against O a real choice, and different people or numbers apart', () => {
    expect(interchangeable('tāku', 'tōku')).toBe(false);
    expect(interchangeable('tāna', 'tōna')).toBe(false);
    expect(interchangeable('taku', 'aku')).toBe(false);
    expect(interchangeable('taku', 'tana')).toBe(false);
    expect(interchangeable('tāku', 'ōku')).toBe(false);
    expect(interchangeable('tō', 'tōku')).toBe(false);
  });

  it('flags other words that would both fit', () => {
    expect(interchangeable('tēnā', 'tērā')).toBe(true);
    expect(interchangeable('mātou', 'tātou')).toBe(true);
    expect(interchangeable('ki', 'i')).toBe(true);
    expect(interchangeable('tēnei', 'tēnā')).toBe(false);
    expect(interchangeable('te', 'ngā')).toBe(false);
  });
});

describe('possessive gaps', () => {
  const possessiveAnswers = ['tōku', 'tāku', 'taku', 'tō', 'ōku', 'āku', 'aku', 'ō', 'tōna', 'tāna', 'tana', 'tāu'];
  const noise = [
    sentence('n1', ['ko', 'tāku', 'taku', 'tōku', 'tō', 'tāu', 'tōna', 'tana', 'ōku', 'aku', 'ana', 'ō']),
    ...pool,
  ];

  it('never offers an option that would also be right for the answer', () => {
    for (const answer of possessiveAnswers) {
      const s = sentence('p', ['he', answer, 'tamariki']);
      for (let seed = 1; seed <= 150; seed++) {
        const gap = buildGap(s, noise, createRng(seed));
        if (s.tiles[gap.gapIndex] !== answer) continue;
        for (const option of gap.options.filter((o) => o !== answer)) {
          expect(interchangeable(answer, option), `${answer} vs ${option}`).toBe(false);
        }
      }
    }
  });

  it('can still offer A against O for the same person', () => {
    const s = sentence('q', ['he', 'tōku', 'tamariki']);
    let seen = false;
    for (let seed = 1; seed <= 300 && !seen; seed++) {
      const gap = buildGap(s, noise, createRng(seed));
      if (s.tiles[gap.gapIndex] === 'tōku' && gap.options.includes('tāku')) seen = true;
    }
    expect(seen).toBe(true);
  });
});

describe('no gap question has two valid options', () => {
  it('holds for every real sentence over many seeds', () => {
    for (const level of ['beginner', 'intermediate'] as const) {
      const sentences = sentencesForLevel(level);
      for (const s of sentences) {
        for (let seed = 1; seed <= 25; seed++) {
          const gap = buildGap(s, sentences, createRng(seed));
          const answer = s.tiles[gap.gapIndex];
          for (const option of gap.options.filter((o) => o !== answer)) {
            expect(interchangeable(answer, option), `${s.mi}: ${answer} vs ${option}`).toBe(false);
          }
        }
      }
    }
  });
});
