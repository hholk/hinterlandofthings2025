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

test('global styles guard iOS safe areas on mobile', () => {
  const css = read('./style.css');
  // Für Anfänger:innen: Mit Safe-Area-Variablen verhindern wir abgeschnittene Inhalte auf iPhones mit Dynamic Island.
  assert.ok(css.includes('--safe-area-top'), 'Safe-area custom properties should be present for iOS 26 layouts');
  assert.ok(/@media \(max-width: 600px\) \{\s+\.site-wrapper/.test(css), 'Mobile breakpoint keeps cards in a single column');
});

test('app shell falls back auf natives Scrolling, wenn Smooth-Scroll fehlt', () => {
  const layout = read('./src/routes/+layout.svelte');

  assert.ok(/\.app-shell\s*\{[^}]*overflow:\s*auto;/.test(layout), 'Default overflow should permit native scroll');
  assert.ok(
    /\.app-shell\.has-smooth-scroll\s*\{[^}]*overflow:\s*hidden;/.test(layout),
    'Smooth-scroll mode should explicitly hide overflow'
  );
  assert.ok(
    layout.includes("classList.add('has-smooth-scroll')"),
    'Layout should toggle the CSS hook when LocomotiveScroll initialises'
  );
});

