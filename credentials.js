(function (global) {
  // Für Einsteiger:innen: Wir speichern nur den Hash und niemals das Klartext-Passwort im Repository.
  // Hash für "hinterland2025" – hilft Einsteiger:innen, die Verbindung zur Login-Seite zu verstehen.
  const credentials = { passwordHash: 'fd83af4d7dad74cc994fcb0551f6c3070967c53731175d2bf6e62d9b7e626447' };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = credentials;
  }

  if (global) {
    global.CREDENTIALS = credentials;
  }
})(typeof window !== 'undefined' ? window : globalThis);
