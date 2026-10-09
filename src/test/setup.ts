import { loadLevels } from '../content/content';

// Tests use the whole course synchronously, so load every level up front.
await loadLevels(['beginner', 'intermediate', 'advanced']);
