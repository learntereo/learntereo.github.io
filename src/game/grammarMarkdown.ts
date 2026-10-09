/**
 * A tiny, safe Markdown subset for grammar notes: headings, paragraphs,
 * lists, **bold** and *italic*. The result is a plain data tree that React
 * renders as elements, so no HTML string is ever built or injected. Anything
 * else (including raw HTML, links and images) stays as literal text.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong'; children: Inline[] }
  | { type: 'em'; children: Inline[] };

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; children: Inline[] }
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] };

/** True when the text contains something that looks like an HTML tag or comment. */
export function hasRawHtml(markdown: string): boolean {
  return /<\/?[a-z][^>]*>|<!--/i.test(markdown);
}

function pushText(out: Inline[], text: string): void {
  if (text === '') return;
  const last = out[out.length - 1];
  if (last && last.type === 'text') last.text += text;
  else out.push({ type: 'text', text });
}

/** Index of the closing marker, skipping escaped characters. -1 when there is none. */
function findClose(source: string, from: number, marker: string): number {
  for (let i = from; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
      continue;
    }
    if (source.startsWith(marker, i)) {
      // A single * must not be the start of a ** pair.
      if (marker === '*' && source[i + 1] === '*') {
        i++;
        continue;
      }
      return i;
    }
  }
  return -1;
}

export function parseInline(source: string): Inline[] {
  const out: Inline[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === '\\' && i + 1 < source.length && '*\\'.includes(source[i + 1])) {
      pushText(out, source[i + 1]);
      i += 2;
      continue;
    }
    if (source.startsWith('**', i)) {
      const close = findClose(source, i + 2, '**');
      if (close > i + 2) {
        out.push({ type: 'strong', children: parseInline(source.slice(i + 2, close)) });
        i = close + 2;
        continue;
      }
      pushText(out, '**');
      i += 2;
      continue;
    }
    if (ch === '*') {
      const close = findClose(source, i + 1, '*');
      if (close > i + 1) {
        out.push({ type: 'em', children: parseInline(source.slice(i + 1, close)) });
        i = close + 1;
        continue;
      }
    }
    pushText(out, ch);
    i++;
  }
  return out;
}

const HEADING = /^(#{1,3})\s+(.*\S)\s*$/;
const BULLET = /^[-*]\s+(.*\S)\s*$/;
const ORDERED = /^\d+[.)]\s+(.*\S)\s*$/;

export function parseGrammarMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: Inline[][] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', children: parseInline(paragraph.join(' ')) });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push({ type: 'list', ordered: list.ordered, items: list.items });
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') {
      flushParagraph();
      flushList();
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, children: parseInline(heading[2]) });
      continue;
    }
    const bullet = BULLET.exec(line);
    const ordered = bullet ? null : ORDERED.exec(line);
    const item = bullet ?? ordered;
    if (item) {
      flushParagraph();
      const isOrdered = ordered !== null;
      if (list && list.ordered !== isOrdered) flushList();
      if (!list) list = { ordered: isOrdered, items: [] };
      list.items.push(parseInline(item[1]));
      continue;
    }
    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}
