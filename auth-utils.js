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

    if (typeof global.crypto !== 'undefined' && global.crypto.subtle) {
      const buffer = await global.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
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
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
