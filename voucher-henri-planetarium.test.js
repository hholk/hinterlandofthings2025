const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// Für Anfänger:innen: Wir prüfen automatisiert, ob die neue Gutscheinseite weiterhin
// zentrale Inhalte enthält und korrekt in der Experience-Konfiguration auftaucht.
const voucherPath = path.join(__dirname, 'voucher-henri-planetarium.html');
const html = fs.readFileSync(voucherPath, 'utf8');

test('planetarium voucher renders the cosmic hero section', () => {
  assert.ok(html.includes('Ein kosmischer Gutschein für Henri'), 'Die Hauptüberschrift macht den Gutschein persönlich.');
  assert.ok(html.includes('Planetarium Osnabrück'), 'Der Bezug zum Planetarium ist Pflicht.');
});

test('planetarium voucher highlights the Sonnensystem show', () => {
  assert.ok(html.includes('Unser Sonnensystem'), 'Die gewünschte Show muss im Text erscheinen.');
  assert.ok(html.includes('Klaus-Strick-Weg'), 'Die Adresse hilft bei der Orientierung.');
});

test('planetarium voucher is registered in experience pages config', () => {
  const pages = require('./experience-pages.js');
  const voucherPage = pages.find((page) => page.id === 'voucher-henri-planetarium');
  assert.ok(voucherPage, 'Die neue Seite sollte in experience-pages.js registriert sein.');
  assert.strictEqual(
    voucherPage.href,
    'voucher-henri-planetarium.html',
    'Der Pfad zum Gutschein muss mit dem HTML-Dokument übereinstimmen.'
  );
});
