(function (global) {
  // Für Einsteiger:innen: Wir speichern nur den Hash und niemals das Klartext-Passwort im Repository.
  const credentials = { passwordHash: '911bb9317e2ce5b62399efddb2d3abc16e5c047862019054d956416920bc979b' };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = credentials;
  }

  if (global) {
    global.CREDENTIALS = credentials;
  }
})(typeof window !== 'undefined' ? window : globalThis);
