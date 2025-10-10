import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('hinterland agenda uses the shared hero shell', () => {
  const html = read('./hinterland.html');
  assert.ok(html.includes('class="page-card site-header"'), 'Header should reuse the glassmorphism hero shell');
  assert.ok(html.includes('class="slot card'), 'Agenda slots should render as cards for visual consistency');
});

test('universal home filter buttons expose accessibility state', () => {
  const html = read('./universal-home.html');
  assert.ok(html.includes('aria-pressed="true"'), 'The default filter button should advertise its pressed state');
  assert.ok(html.includes('aria-pressed="false"'), 'Other filter buttons should start as unpressed');
});

test('miele analysis table enables interactive enhancement', () => {
  const html = read('./miele-analysis.html');
  assert.ok(html.includes('data-enhance="interactive"'), 'Scenario table should request the interactive enhancement');
  assert.ok(html.includes('interactive-tables.js'), 'Interactive helper script should be loaded');
});

