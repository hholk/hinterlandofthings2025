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
