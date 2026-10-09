import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

function token(name: string): string {
  const match = new RegExp('--' + name + ':\\s*(#[0-9a-fA-F]{6})').exec(css);
  if (!match) throw new Error(`token ${name} not found`);
  return match[1];
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

describe('colour contrast (WCAG AA, 4.5:1 for text)', () => {
  const surface = token('color-surface');
  const bg = token('color-ma');
  const grey100 = token('color-grey-100');
  const grey200 = token('color-grey-200');

  it('body text on the page and card backgrounds', () => {
    for (const background of [surface, bg, grey100]) {
      expect(ratio(token('color-pango'), background)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('muted text on every background it appears on', () => {
    for (const background of [surface, bg, grey100]) {
      expect(ratio(token('color-grey-600'), background), background).toBeGreaterThanOrEqual(AA);
    }
  });

  it('brand red and green as text on cards and the page', () => {
    for (const color of [token('color-kokowai'), token('color-pounamu')]) {
      for (const background of [surface, bg]) expect(ratio(color, background)).toBeGreaterThanOrEqual(AA);
    }
  });

  it('white text on buttons and the due badge', () => {
    expect(ratio('#ffffff', token('color-kokowai'))).toBeGreaterThanOrEqual(AA);
    expect(ratio('#ffffff', token('color-pounamu'))).toBeGreaterThanOrEqual(AA);
    expect(ratio('#ffffff', token('color-pango'))).toBeGreaterThanOrEqual(AA);
  });

  it('status badges on the Path', () => {
    expect(ratio('#1f4d39', '#e3f1ea')).toBeGreaterThanOrEqual(AA);
    expect(ratio('#7a4a05', '#fff3de')).toBeGreaterThanOrEqual(AA);
    expect(ratio(token('color-grey-800'), grey200)).toBeGreaterThanOrEqual(AA);
  });
});
