(function (global) {
  'use strict';

  /**
   * Create a SHA-256 hash for the provided password.
   * Uses the browser SubtleCrypto API when available and
   * falls back to Node's crypto module for testing.
   * @param {string} password - The plain text password to hash.
   * @returns {Promise<string>} Hex encoded hash.
   */
  async function hashPassword(password) {
    if (typeof password !== 'string') {
      throw new TypeError('Password must be a string');
    }

    const webCrypto = getWebCrypto();
    if (webCrypto && webCrypto.subtle) {
      const byteData = encodeToUint8Array(password);
      const buffer = await webCrypto.subtle.digest('SHA-256', byteData);
      return bufferToHex(buffer);
    }

    if (isNodeEnvironment()) {
      const { createHash } = require('node:crypto');
      return createHash('sha256').update(password).digest('hex');
    }

    throw new Error('No cryptographic implementation available for hashing');
  }

  /**
   * Synchronous helper primarily used in Node.js tests where the
   * SubtleCrypto API is not available.
   * @param {string} password - The plain text password to hash.
   * @returns {string} Hex encoded hash.
   */
  function hashPasswordSync(password) {
    if (!isNodeEnvironment()) {
      throw new Error('hashPasswordSync is only available in Node.js environments');
    }

    const { createHash } = require('node:crypto');
    return createHash('sha256').update(password).digest('hex');
  }

  /**
   * Compare the provided password with the stored hash.
   * @param {string} password - Password provided by the user.
   * @param {string} expectedHash - Stored hash to compare against.
   * @returns {Promise<boolean>} Result of the comparison.
   */
  async function verifyPassword(password, expectedHash) {
    const hash = await hashPassword(password);
    return timingSafeEqual(hash, expectedHash);
  }

  /**
   * Node.js helper for verifying a password synchronously.
   * @param {string} password - Password provided by the user.
   * @param {string} expectedHash - Stored hash to compare against.
   * @returns {boolean} Result of the comparison.
   */
  function verifyPasswordSync(password, expectedHash) {
    if (!isNodeEnvironment()) {
      throw new Error('verifyPasswordSync is only available in Node.js environments');
    }

    const hash = hashPasswordSync(password);
    return timingSafeEqual(hash, expectedHash);
  }

  /**
   * Ensure comparisons take a consistent amount of time to reduce
   * the risk of timing attacks. This is a simplified approach that
   * is sufficient for our static-site use case.
   * @param {string} hash - First hash to compare.
   * @param {string} expected - Second hash to compare.
   * @returns {boolean} Whether both hashes are identical.
   */
  function timingSafeEqual(hash, expected) {
    if (typeof hash !== 'string' || typeof expected !== 'string') {
      return false;
    }

    if (hash.length !== expected.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < hash.length; i += 1) {
      result |= hash.charCodeAt(i) ^ expected.charCodeAt(i);
    }
    return result === 0;
  }

  function bufferToHex(buffer) {
    let view;

    if (buffer instanceof ArrayBuffer) {
      view = new Uint8Array(buffer);
    } else if (ArrayBuffer.isView(buffer)) {
      view = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      throw new TypeError('bufferToHex erwartet einen ArrayBuffer oder eine TypedArray-Ansicht');
    }

    return Array.from(view)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Kleinster gemeinsamer Nenner für Browser (z. B. iOS 15 Safari), die noch
   * keinen TextEncoder kennen. Wir wandeln Zeichen daher manuell in UTF-8 um,
   * damit das Hashing auch auf älteren Smartphones funktioniert.
   * @param {string} input - Text, der in Bytes umgewandelt werden soll.
   * @returns {Uint8Array} UTF-8 codierte Bytefolge.
   */
  function encodeToUint8Array(input) {
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(input);
    }

    const bytes = [];
    for (let i = 0; i < input.length; i += 1) {
      let codePoint = input.codePointAt(i);

      // Bei Surrogat-Paaren den Index weiter erhöhen.
      if (codePoint > 0xffff) {
        i += 1;
      }

      if (codePoint <= 0x7f) {
        bytes.push(codePoint);
      } else if (codePoint <= 0x7ff) {
        bytes.push(0xc0 | (codePoint >> 6));
        bytes.push(0x80 | (codePoint & 0x3f));
      } else if (codePoint <= 0xffff) {
        bytes.push(0xe0 | (codePoint >> 12));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
        bytes.push(0x80 | (codePoint & 0x3f));
      } else {
        bytes.push(0xf0 | (codePoint >> 18));
        bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
        bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
        bytes.push(0x80 | (codePoint & 0x3f));
      }
    }

    return new Uint8Array(bytes);
  }

  function getWebCrypto() {
    if (typeof global === 'undefined') {
      return undefined;
    }

    if (global.crypto && global.crypto.subtle) {
      return global.crypto;
    }

    if (global.msCrypto && global.msCrypto.subtle) {
      return global.msCrypto;
    }

    return undefined;
  }

  function isNodeEnvironment() {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
  }

  const api = {
    hashPassword,
    hashPasswordSync,
    verifyPassword,
    verifyPasswordSync,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  if (global) {
    global.AuthUtils = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
