import { Fragment, useMemo, type ReactNode } from 'react';
import { parseGrammarMarkdown, type Inline } from '../../game/grammarMarkdown';
import styles from './GrammarNote.module.css';

function renderInline(nodes: readonly Inline[]): ReactNode {
  return nodes.map((node, i) => {
    switch (node.type) {
      case 'text':
        return <Fragment key={i}>{node.text}</Fragment>;
      case 'strong':
        return <strong key={i}>{renderInline(node.children)}</strong>;
      case 'em':
        // Italics mark Māori words and phrases in the grammar notes.
        return (
          <em key={i} lang="mi">
            {renderInline(node.children)}
          </em>
        );
    }
  });
}

/** Renders a grammar note. The Markdown is parsed to a tree and drawn as plain elements, never as raw HTML. */
export function GrammarNote({ markdown }: { markdown: string }) {
  const blocks = useMemo(() => parseGrammarMarkdown(markdown), [markdown]);
  return (
    <div className={styles.note}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const Tag = block.level === 1 ? 'h3' : block.level === 2 ? 'h4' : 'h5';
            return <Tag key={i}>{renderInline(block.children)}</Tag>;
          }
          case 'paragraph':
            return <p key={i}>{renderInline(block.children)}</p>;
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul';
            return (
              <Tag key={i}>
                {block.items.map((item, j) => (
                  <li key={j}>{renderInline(item)}</li>
                ))}
              </Tag>
            );
          }
        }
      })}
    </div>
  );
}
