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
 * the same headings, intro, level summaries and unit lists as the Landing page, generated from unitIndex.json
 * so it cannot drift from the course. createRoot replaces it on mount.
 */
function staticLandingHtml(): string {
  const unitIndex = JSON.parse(readFileSync(new URL('./src/content/unitIndex.json', import.meta.url), 'utf8')) as IndexedUnit[];
  const byLevel = LEVEL_LABELS.map(([level, label]) => ({
    label,
    units: unitIndex.filter((u) => u.level === level).sort((a, b) => a.order - b.order),
  }));
  const total = byLevel.reduce((n, l) => n + l.units.length, 0);
  const cards = byLevel
    .map(
      (l) =>
        `<div><h3>${l.label}</h3><p>${l.units.length} units</p><ul>${l.units
          .slice(0, 3)
          .map((u) => `<li>${escapeHtml(u.title)}</li>`)
          .join('')}</ul></div>`,
    )
    .join('');
  const lists = byLevel
    .map(
      (l) =>
        `<div><h3>${l.label}</h3><ul>${l.units
          .map((u) => `<li>${escapeHtml(u.title)} <span lang="mi">${escapeHtml(u.titleMi)}</span></li>`)
          .join('')}</ul></div>`,
    )
    .join('');
  return [
    '<main>',
    '<header>',
    '<p lang="mi">Ako</p>',
    '<h1>Learn te reo <span lang="mi">Māori</span></h1>',
    '<p>Short lessons that work on your phone, from your first <span lang="mi">kia ora</span> to full sentences.</p>',
    '</header>',
    '<section>',
    '<h2>Three levels</h2>',
    cards,
    `<details open><summary>See all ${total} units</summary>${lists}</details>`,
    '</section>',
    '<section>',
    '<h2>Write your pepeha</h2>',
    '<p>Introduce yourself in te reo <span lang="mi">Māori</span>. No sign-in needed.</p>',
    '<p><a href="/pepeha/">Open the pepeha builder</a></p>',
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
    `<p><a href="/">Learn te reo ${mi('Māori')} with Ako</a></p>`,
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
  base: '/',
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
