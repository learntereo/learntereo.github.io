import { describe, expect, it } from 'vitest';
import { FACTS, factForUnit } from './facts';
import { units } from './content';

describe('unit facts', () => {
  it('has 22 facts, one per unit, in course order', () => {
    expect(FACTS).toHaveLength(22);
    expect(FACTS.map((f) => f.afterUnit)).toEqual(Array.from({ length: 22 }, (_, i) => i + 1));
    expect(units).toHaveLength(22);
    units.forEach((unit, i) => expect(factForUnit(unit.id), unit.id).toBe(FACTS[i].text));
  });

  it('has real text with no em dashes', () => {
    for (const fact of FACTS) {
      expect(fact.text.trim().length).toBeGreaterThan(40);
      expect(fact.text).not.toContain(String.fromCharCode(0x2014));
    }
  });

  it('gives nothing for an unknown unit', () => {
    expect(factForUnit('zz99-missing')).toBeUndefined();
  });
});
