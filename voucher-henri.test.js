const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Für Anfänger:innen: Wir lesen die HTML-Datei als Text ein und prüfen, ob zentrale Elemente
// enthalten sind. So stellen wir automatisch sicher, dass die Seite nicht versehentlich
// entfernt oder stark verändert wird.
const voucherPath = path.join(__dirname, 'voucher-henri.html');

const html = fs.readFileSync(voucherPath, 'utf8');

test('voucher page exports the expected hero section', () => {
  assert.ok(html.includes('<header class="hero">'), 'Hero-Abschnitt mit Gradient wird benötigt');
  assert.ok(
    html.includes('Abenteuer Piesberg Gutschein'),
    'Die Hauptüberschrift sollte weiterhin den Gutschein benennen'
  );
});

test('voucher page mentions Henri and the UNESCO Kontext', () => {
  assert.ok(html.includes('Henri'), 'Der Name Henri macht den Gutschein persönlich.');
  assert.ok(html.includes('UNESCO'), 'Der UNESCO-Kontext gehört zum Informationsgehalt der Seite.');
});

test('voucher experience is registered in experience pages config', () => {
  const pages = require('./experience-pages.js');
  const voucherPage = pages.find((page) => page.id === 'voucher-henri');
  assert.ok(voucherPage, 'Die Seite sollte in experience-pages.js registriert sein.');
  assert.strictEqual(
    voucherPage.href,
    'voucher-henri.html',
    'Der Pfad zum Gutschein muss mit dem HTML-Dokument übereinstimmen.'
  );
});
