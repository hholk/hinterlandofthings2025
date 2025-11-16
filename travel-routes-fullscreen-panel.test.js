import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const travelPage = readFileSync(
  new URL('./src/routes/experiences/travel-routes/+page.svelte', import.meta.url),
  'utf8'
);

test('travel routes fullscreen panel exposes dialog semantics with imagery', () => {
  assert.match(
    travelPage,
    /<article\s+class=\"travel__map-fullscreen-panel\"[\s\S]*role=\"dialog\"[\s\S]*aria-modal=\"true\"/,
    'Panel should be rendered as modal dialog for assistive tech'
  );
  assert.ok(
    travelPage.includes('travel__map-fullscreen-panel__media'),
    'Panel keeps the media block so POI photos stay visible'
  );
});

test('travel routes fullscreen panel is positioned as overlay in fullscreen mode', () => {
  assert.match(
    travelPage,
    /\.travel__map--fullscreen\s+\.travel__map-fullscreen-panel\s*\{[\s\S]*position:\s*absolute;/,
    'Fullscreen state should absolutely position the overlay'
  );
  assert.match(
    travelPage,
    /\.travel__map--fullscreen\s+\.travel__map-fullscreen-panel\s*\{[\s\S]*max-height:\s*min\(/,
    'Fullscreen overlay should clamp its height for scrollability'
  );
});
