import { icons } from '../../content/icons';
import type { WordItem } from '../../game/types';
import styles from './ItemImage.module.css';

/** Renders a word's emoji or registered SVG icon. The English meaning is the accessible name. */
export function ItemImageView({ item, size = 'medium' }: { item: WordItem; size?: 'medium' | 'large' }) {
  const image = item.image;
  if (!image) return null;
  const sizeClass = size === 'large' ? styles.large : styles.medium;

  if ('emoji' in image) {
    return (
      <span className={`${styles.image} ${sizeClass}`} role="img" aria-label={item.en[0]}>
        {image.emoji}
      </span>
    );
  }
  const markup = icons[image.svg];
  if (!markup) return null;
  return (
    <span
      className={`${styles.image} ${sizeClass}`}
      role="img"
      aria-label={item.en[0]}
      // Icons come from the bundled registry in src/content/icons.ts, never from user input.
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
