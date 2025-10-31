const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

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

test('planetarium voucher image sources stay reachable', async (t) => {
  const imageSources = [
    'https://www.museum-am-schoelerberg.de/wp-content/uploads/2024/07/2024_07_08_Header_Planetarium_2.jpg',
    'https://www.museum-am-schoelerberg.de/wp-content/uploads/2024/08/SMBH-1500x844.jpg',
  ];

  async function fetchStatus(url) {
    return new Promise((resolve, reject) => {
      const request = https.request(url, { method: 'HEAD', family: 4 }, (response) => {
        // Für Anfänger:innen: Wir beenden den Request sofort nach dem Status, damit
        // keine kompletten Bilddaten geladen werden müssen.
        response.destroy();
        resolve(response.statusCode);
      });

      request.on('error', reject);
      request.end();
    });
  }

  for (const url of imageSources) {
    try {
      const statusCode = await fetchStatus(url);
      assert.strictEqual(statusCode, 200, `Bildquelle ${url} liefert Status ${statusCode}.`);
    } catch (error) {
      if (error.code === 'ENETUNREACH' || error.code === 'EAI_AGAIN') {
        t.skip(`Netzwerk nicht erreichbar, daher wurde ${url} nicht geprüft.`);
        return;
      }
      throw error;
    }
  }
});
