/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { EMPTY_INPUT, buildPepeha } from './src/pepeha/buildPepeha.ts';

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
    '<p><a href="/language-learning-website/pepeha/">Pepeha builder</a></p>',
    '</section>',
    '</main>',
  ].join('');
}

/** Page content for /pepeha/: what a pepeha is, the lines it covers and an example, built from the same function the page uses. */
function staticPepehaHtml(): string {
  const example = buildPepeha({
    ...EMPTY_INPUT,
    kind: 'tauiwi',
    name: 'Sam',
    ancestors1: 'Scotland',
    born: 'Christchurch',
    grewUp: 'Dunedin',
    maunga: 'Aoraki',
    live: 'Wellington',
  });
  const mi = (text: string) => `<span lang="mi">${escapeHtml(text)}</span>`;
  const covers = [
    `Your ${mi('maunga')} (mountain)`,
    `Your ${mi('awa')}, ${mi('roto')} or ${mi('moana')} (river, lake or sea)`,
    `Your ${mi('waka')} (canoe)`,
    `Your ${mi('iwi')} (tribe) and ${mi('hapū')} (subtribe)`,
    `Your ${mi('marae')}`,
    `Or, if you are tauiwi: where your ancestors are from, and where you were born, grew up and live now`,
    `Your parents and your name`,
  ];
  return [
    '<main>',
    '<h1>Pepeha builder</h1>',
    `<p>Write your ${mi('pepeha')} in te reo ${mi('Māori')}, with the English underneath. Free, with no sign-in.</p>`,
    '<section>',
    `<h2>What is a ${mi('pepeha')}?</h2>`,
    `<p>A ${mi('pepeha')} is a way of saying who you are and where you are from. In te reo ${mi('Māori')} you name the places and people you come from, then your own name.</p>`,
    '<h3>A pepeha can cover</h3>',
    `<ul>${covers.map((c) => `<li>${c}</li>`).join('')}</ul>`,
    '<h3>Example</h3>',
    example.map((l) => `<p><span lang="mi">${escapeHtml(l.mi)}</span><br>${escapeHtml(l.en)}</p>`).join(''),
    '</section>',
    `<p><a href="/language-learning-website/">Learn te reo ${mi('Māori')} with Ako</a></p>`,
    '</main>',
  ].join('');
}

/** On build only (the dev server keeps an empty root), puts static content inside #root for each page. */
function staticLanding(): Plugin {
  return {
    name: 'static-landing',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (ctx.server) return html;
        const content = ctx.path.replace(/\\/g, '/').endsWith('/pepeha/index.html') ? staticPepehaHtml() : staticLandingHtml();
        return html.replace('<div id="root"></div>', () => `<div id="root">${content}</div>`);
      },
    },
  };
}

export default defineConfig({
  base: '/language-learning-website/',
  plugins: [react(), staticLanding()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        pepeha: fileURLToPath(new URL('./pepeha/index.html', import.meta.url)),
      },
    },
  },
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
  },
});
