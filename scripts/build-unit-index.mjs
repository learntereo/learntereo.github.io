// Rebuilds src/content/unitIndex.json from the unit files.
// The index holds just the unit headers (title, order, item ids). It is bundled
// with the app so the Path can work out which units are open, while the words
// and sentences stay in per-level chunks that are downloaded on demand.
// Run this after adding or changing a unit file: npm run content:index
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const unitsDir = path.join(root, '..', 'src', 'content', 'units');
const levelOrder = ['beginner', 'intermediate', 'advanced'];

const headers = readdirSync(unitsDir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => {
    // The title breakdown stays in the unit file (it loads with the level), not in the bundled index.
    const header = JSON.parse(readFileSync(path.join(unitsDir, f), 'utf8')).unit;
    delete header.titleBreakdown;
    return header;
  })
  .sort((a, b) => levelOrder.indexOf(a.level) - levelOrder.indexOf(b.level) || a.order - b.order);

writeFileSync(path.join(unitsDir, '..', 'unitIndex.json'), JSON.stringify(headers, null, 2) + '\n');
console.log(`Wrote ${headers.length} unit headers`);
