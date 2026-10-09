/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

interface IndexedUnit {
  level: string;
  order: number;
  title: string;
  titleMi: string;
}

const LEVEL_LABELS: [level: string, label: string][] = [
  ['beginner', 'Beginner'],
  ['intermediate', 'Intermediate'],
  ['advanced', 'Advanced'],
];

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Builds the page content a crawler (or a browser with scripts off) sees before React mounts:
 * the same headings, intro and level/unit lists as the Landing page, generated from unitIndex.json
 * so it cannot drift from the course. createRoot replaces it on mount.
 */
function staticLandingHtml(): string {
  const unitIndex = JSON.parse(readFileSync(new URL('./src/content/unitIndex.json', import.meta.url), 'utf8')) as IndexedUnit[];
  const levels = LEVEL_LABELS.map(([level, label]) => {
    const items = unitIndex
      .filter((u) => u.level === level)
      .sort((a, b) => a.order - b.order)
      .map((u) => `<li>${escapeHtml(u.title)} (<span lang="mi">${escapeHtml(u.titleMi)}</span>)</li>`)
      .join('');
    return `<div><h3>${label}</h3><ul>${items}</ul></div>`;
  });
  return [
    '<main>',
    '<h1 lang="mi">Ako</h1>',
    '<p>Ako: learn te reo <span lang="mi">Māori</span>, one kupu at a time.</p>',
    '<section>',
    '<h2>Learn te reo <span lang="mi">Māori</span>, free</h2>',
    '<p>Ako is a free way to learn te reo <span lang="mi">Māori</span>. Short lessons that work on your phone, from beginner to advanced. Vocabulary, sentences and pronunciation, made in New Zealand.</p>',
    ...levels,
    '</section>',
    '</main>',
  ].join('');
}

/** On build only (the dev server keeps an empty root), puts the static landing content inside #root. */
function staticLanding(): Plugin {
  return {
    name: 'static-landing',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (ctx.server) return html;
        return html.replace('<div id="root"></div>', () => `<div id="root">${staticLandingHtml()}</div>`);
      },
    },
  };
}

export default defineConfig({
  base: '/language-learning-website/',
  plugins: [react(), staticLanding()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
  },
});
