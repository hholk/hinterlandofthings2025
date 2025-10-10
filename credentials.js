(function (global) {
  const credentials = { passwordHash: 'cf66d4160e9444c8149eedf284e8930ada8b350987e7635bc0c9d90c803f887b' };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = credentials;
  }

  if (global) {
    global.CREDENTIALS = credentials;
  }
})(typeof window !== 'undefined' ? window : globalThis);
