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
  assert.ok(html.includes('events-section'), 'Event filter lives inside the shared events-section card');
});

test('miele analysis table enables interactive enhancement', () => {
  const html = read('./miele-analysis.html');
  assert.ok(html.includes('data-enhance="interactive"'), 'Scenario table should request the interactive enhancement');
  assert.ok(html.includes('interactive-tables.js'), 'Interactive helper script should be loaded');
});

test('universal home timeslots wraps calendar in shared shell', () => {
  const html = read('./universal-home-timeslots.html');
  assert.ok(html.includes('calendar-shell'), 'Calendar should reuse the shared card styling class');
  assert.ok(html.includes('sr-note'), 'Accessible helper copy keeps the external widget understandable');
});

test('global toolbar anchors every page in the new iOS 26 shell', () => {
  const files = [
    './index.html',
    './login.html',
    './hinterland.html',
    './universal-home.html',
    './universal-home-timeslots.html',
    './miele-analysis.html'
  ];
  files.forEach((path) => {
    const html = read(path);
    assert.ok(
      html.includes('class="app-toolbar"'),
      `${path} should render the shared toolbar to stay visually consistent`
    );
    assert.ok(
      html.includes('aria-label="Globale Navigation"'),
      `${path} should expose a labelled navigation landmark for beginners using assistive tech`
    );
  });
});

test('style sheet exposes new iOS 26 design tokens', () => {
  const css = read('./style.css');
  assert.ok(css.includes('--accent-soft'), 'Soft accent token keeps hover states familiar');
  assert.ok(css.includes('--blur-backdrop'), 'Backdrop blur token mirrors iOS depth');
  assert.ok(css.includes('--space-md'), 'Consistent spacing scale is defined once');
});

