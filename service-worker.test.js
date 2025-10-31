const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Für Anfänger:innen: Wir testen, ob der Service Worker die neuen Assets kennt.
const swPath = path.join(__dirname, 'service-worker.js');
const source = fs.readFileSync(swPath, 'utf8');

const extractArray = (code, marker) => {
  const start = code.indexOf(marker);
  if (start === -1) {
    return [];
  }
  const afterMarker = code.slice(start + marker.length);
  const arrayMatch = afterMarker.match(/\[(.*?)\]/s);
  if (!arrayMatch) {
    return [];
  }
  return arrayMatch[1]
    .split(',')
    .map((entry) => entry.trim().replace(/^['"`]|['"`]$/g, ''))
    .filter(Boolean);
};

test('service worker version bump invalidates stale caches', () => {
  assert.ok(
    source.includes("const CACHE_VERSION = 'v3'"),
    'Die Cache-Version sollte erhöht werden, damit Browser neue Dateien laden.'
  );
});

test('service worker precaches voucher pages and experience config', () => {
  const assets = extractArray(source, 'const ASSETS = ');
  assert.ok(
    assets.includes('./voucher-henri-planetarium.html'),
    'Der neue Gutschein muss offline verfügbar sein.'
  );
  assert.ok(
    assets.includes('./voucher-henri.html'),
    'Auch der ursprüngliche Gutschein bleibt offline abrufbar.'
  );
  assert.ok(
    assets.includes('./experience-pages.js'),
    'Die Experience-Konfiguration wird für zuverlässige Updates mitgecached.'
  );
  assert.ok(
    assets.includes('./experience-ui.js'),
    'Das Rendering-Script sollte zusammen mit der Konfiguration offline bereitstehen.'
  );
});
