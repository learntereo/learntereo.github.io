import { describe, expect, it } from 'vitest';
import { hasRawHtml, parseGrammarMarkdown, type Block, type Inline } from './grammarMarkdown';

const text = (t: string): Inline => ({ type: 'text', text: t });

describe('parseGrammarMarkdown blocks', () => {
  it('parses headings of levels 1 to 3', () => {
    expect(parseGrammarMarkdown('# One\n## Two\n### Three')).toEqual<Block[]>([
      { type: 'heading', level: 1, children: [text('One')] },
      { type: 'heading', level: 2, children: [text('Two')] },
      { type: 'heading', level: 3, children: [text('Three')] },
    ]);
  });

  it('joins consecutive lines into one paragraph and splits on blank lines', () => {
    expect(parseGrammarMarkdown('first line\nsecond line\n\nnext paragraph')).toEqual<Block[]>([
      { type: 'paragraph', children: [text('first line second line')] },
      { type: 'paragraph', children: [text('next paragraph')] },
    ]);
  });

  it('parses unordered lists with - or *', () => {
    expect(parseGrammarMarkdown('- one\n- two\n\n* three')).toEqual<Block[]>([
      { type: 'list', ordered: false, items: [[text('one')], [text('two')]] },
      { type: 'list', ordered: false, items: [[text('three')]] },
    ]);
  });

  it('parses ordered lists', () => {
    expect(parseGrammarMarkdown('1. a\n2. b')).toEqual<Block[]>([
      { type: 'list', ordered: true, items: [[text('a')], [text('b')]] },
    ]);
  });

  it('ends a paragraph when a heading or list starts', () => {
    const blocks = parseGrammarMarkdown('intro\n## Head\ntext\n- item');
    expect(blocks.map((b) => b.type)).toEqual(['paragraph', 'heading', 'paragraph', 'list']);
  });

  it('returns nothing for empty input', () => {
    expect(parseGrammarMarkdown('')).toEqual([]);
    expect(parseGrammarMarkdown('\n\n  \n')).toEqual([]);
  });

  it('copes with Windows line endings', () => {
    expect(parseGrammarMarkdown('## Hi\r\n\r\ntext\r\n')).toEqual<Block[]>([
      { type: 'heading', level: 2, children: [text('Hi')] },
      { type: 'paragraph', children: [text('text')] },
    ]);
  });
});

describe('parseGrammarMarkdown inline', () => {
  it('parses bold and italic', () => {
    expect(parseGrammarMarkdown('a **bold** and *kia ora* here')).toEqual<Block[]>([
      {
        type: 'paragraph',
        children: [
          text('a '),
          { type: 'strong', children: [text('bold')] },
          text(' and '),
          { type: 'em', children: [text('kia ora')] },
          text(' here'),
        ],
      },
    ]);
  });

  it('allows italic inside bold', () => {
    const [block] = parseGrammarMarkdown('**say *tēnā koe* now**');
    expect(block).toEqual<Block>({
      type: 'paragraph',
      children: [{ type: 'strong', children: [text('say '), { type: 'em', children: [text('tēnā koe')] }, text(' now')] }],
    });
  });

  it('keeps unclosed markers as plain text', () => {
    expect(parseGrammarMarkdown('a * b and **c')).toEqual<Block[]>([
      { type: 'paragraph', children: [text('a * b and **c')] },
    ]);
  });

  it('supports backslash escapes', () => {
    expect(parseGrammarMarkdown('a \\*not italic\\* b')).toEqual<Block[]>([
      { type: 'paragraph', children: [text('a *not italic* b')] },
    ]);
  });

  it('parses inline markup inside headings and list items', () => {
    const [heading, list] = parseGrammarMarkdown('## The *ngā* word\n- **te**: one');
    expect(heading).toMatchObject({ children: [text('The '), { type: 'em', children: [text('ngā')] }, text(' word')] });
    expect(list).toMatchObject({ items: [[{ type: 'strong', children: [text('te')] }, text(': one')]] });
  });
});

describe('raw HTML is never interpreted', () => {
  it('keeps tags as literal text and produces only known node types', () => {
    const blocks = parseGrammarMarkdown('<script>alert(1)</script>\n\n<b>bold?</b> and <img src=x onerror=alert(1)>');
    const flat = JSON.stringify(blocks);
    expect(flat).toContain('<script>alert(1)</script>');
    const types = new Set<string>();
    const walk = (nodes: readonly (Block | Inline)[]) => {
      for (const n of nodes) {
        types.add(n.type);
        if ('children' in n) walk(n.children);
        if ('items' in n) n.items.forEach((item) => walk(item));
      }
    };
    walk(blocks);
    expect([...types].every((t) => ['paragraph', 'text', 'heading', 'list', 'strong', 'em'].includes(t))).toBe(true);
  });

  it('does not turn links or images into nodes', () => {
    const blocks = parseGrammarMarkdown('[x](javascript:alert(1)) ![y](z)');
    expect(blocks).toEqual<Block[]>([
      { type: 'paragraph', children: [text('[x](javascript:alert(1)) ![y](z)')] },
    ]);
  });

  it('detects raw HTML so content checks can reject it', () => {
    expect(hasRawHtml('plain *text* and **bold**')).toBe(false);
    expect(hasRawHtml('a < b and c > d')).toBe(false);
    expect(hasRawHtml('<b>x</b>')).toBe(true);
    expect(hasRawHtml('text <script>x</script>')).toBe(true);
    expect(hasRawHtml('<!-- comment -->')).toBe(true);
    expect(hasRawHtml('<img src=x>')).toBe(true);
  });
});
