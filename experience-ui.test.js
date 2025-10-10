const test = require('node:test');
const assert = require('node:assert');

const pages = require('./experience-pages.js');
const { createFeatureCardHTML, renderExperienceCards } = require('./experience-ui.js');

test('experience pages export contains the expected structure', () => {
  assert.ok(Array.isArray(pages), 'pages should be an array');
  assert.ok(pages.length >= 5, 'pages array should include all subpages');
  for (const page of pages) {
    assert.ok(page.id, 'page needs an id');
    assert.ok(page.href.endsWith('.html') || page.href.endsWith('/index.html'), 'page href should point to html document');
    assert.ok(page.title.length > 0, 'page title must not be empty');
    assert.ok(page.icon.includes('<svg'), 'page icon should contain svg markup');
  }

  const uniqueIds = new Set(pages.map((page) => page.id));
  assert.strictEqual(uniqueIds.size, pages.length, 'page ids should be unique');
});

test('createFeatureCardHTML renders essential attributes for VanillaTilt integration', () => {
  const html = createFeatureCardHTML(pages[0]);
  assert.ok(html.includes('class="feature-card"'), 'card should include feature-card class');
  assert.ok(html.includes(`href="${pages[0].href}`), 'card should include the correct href');
  assert.ok(html.includes('data-page-id'), 'card should expose data-page-id for easier debugging');
  assert.ok(html.includes('feature-arrow'), 'card should include arrow affordance');
});

test('renderExperienceCards is a no-op without container', () => {
  // Für Anfänger:innen: Eine leere Funktion darf keine Fehler werfen, wenn
  // versehentlich kein Container übergeben wird.
  assert.doesNotThrow(() => renderExperienceCards(null, pages));
});
