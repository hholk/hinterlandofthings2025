const test = require('node:test');
const assert = require('node:assert');
const { hashPasswordSync, verifyPassword, verifyPasswordSync } = require('./auth-utils');
const { passwordHash } = require('./credentials.js');

// Hinweis für Einsteiger:innen: Passe das Test-Passwort an, sobald sich das Event-Passwort ändert.
const VALID_PASSWORD = '689i9052A.hint';
const INVALID_PASSWORD = 'WrongPassword123';

test('hashPasswordSync produces expected hash for the valid password', () => {
  const hash = hashPasswordSync(VALID_PASSWORD);
  assert.strictEqual(hash, passwordHash);
});

test('verifyPassword resolves true for the valid password', async () => {
  const result = await verifyPassword(VALID_PASSWORD, passwordHash);
  assert.strictEqual(result, true);
});

test('verifyPasswordSync returns false for an invalid password', () => {
  const result = verifyPasswordSync(INVALID_PASSWORD, passwordHash);
  assert.strictEqual(result, false);
});

test('hashPassword falls back when TextEncoder is missing (simulated mobile Safari)', async () => {
  const originalTextEncoder = global.TextEncoder;
  const originalCrypto = global.crypto;

  // Wir simulieren einen älteren mobilen Browser, der keinen TextEncoder kennt,
  // aber bereits die WebCrypto-API bereitstellt. Dafür reicht ein einfacher Stub.
  delete global.TextEncoder;
  global.crypto = {
    subtle: {
      async digest(algorithm, data) {
        assert.strictEqual(algorithm, 'SHA-256');
        const bytes = Buffer.from(new Uint8Array(data));
        return require('node:crypto').createHash('sha256').update(bytes).digest();
      },
    },
  };

  const { hashPassword } = require('./auth-utils');
  const hash = await hashPassword(VALID_PASSWORD);
  assert.strictEqual(hash, passwordHash);

  global.crypto = originalCrypto;
  if (originalTextEncoder) {
    global.TextEncoder = originalTextEncoder;
  } else {
    delete global.TextEncoder;
  }
});
