const test = require('node:test');
const assert = require('node:assert');
const {
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
  hasActiveSession,
  rememberRedirect,
  consumeRedirect,
  persistSession,
  clearSession
} = require('./auth-utils');
const { passwordHash } = require('./credentials.js');

// Hinweis für Einsteiger:innen: Passe das Test-Passwort an, sobald sich das Event-Passwort ändert.
const VALID_PASSWORD = 'hinterland2025';
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

test('hasActiveSession detects cookie flag and storage fallback', () => {
  assert.strictEqual(hasActiveSession('auth-token=authenticated'), true);
  assert.strictEqual(hasActiveSession('other-cookie=value'), false);

  const stubStorage = {
    getItem(key) {
      if (key === 'auth') {
        return 'true';
      }
      return null;
    }
  };

  assert.strictEqual(hasActiveSession('', stubStorage), true);
});

test('persistSession syncs cookie and localStorage, clearSession resets them', () => {
  const cookieJar = { value: '' };
  global.document = {
    get cookie() {
      return cookieJar.value;
    },
    set cookie(value) {
      cookieJar.value = value;
    }
  };

  const storageState = {};
  global.localStorage = {
    setItem(key, value) {
      storageState[key] = value;
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(storageState, key) ? storageState[key] : null;
    },
    removeItem(key) {
      delete storageState[key];
    }
  };

  persistSession({ cookiePath: '/secure' });
  assert.ok(cookieJar.value.includes('auth-token=authenticated'));
  assert.strictEqual(global.localStorage.getItem('auth'), 'true');

  clearSession({ cookiePath: '/secure' });
  assert.ok(cookieJar.value.includes('auth-token='));
  assert.strictEqual(global.localStorage.getItem('auth'), null);

  delete global.document;
  delete global.localStorage;
});

test('rememberRedirect stores and consumes redirect targets once', () => {
  const bucket = {};
  global.sessionStorage = {
    setItem(key, value) {
      bucket[key] = value;
    },
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(bucket, key) ? bucket[key] : null;
    },
    removeItem(key) {
      delete bucket[key];
    }
  };

  rememberRedirect('/secret/page');
  assert.strictEqual(consumeRedirect(), '/secret/page');
  assert.strictEqual(consumeRedirect(), null);

  delete global.sessionStorage;
});
