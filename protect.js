(function (global) {
  'use strict';

  // Für Einsteiger:innen: Dieser Guard läuft vor jedem Seitenaufbau und stellt sicher,
  // dass nur eingeloggte Personen den Content sehen. Wir nutzen bewusst keine
  // externen Abhängigkeiten, damit die Datei direkt auf GitHub Pages funktioniert.

  function redirectToLogin() {
    const loginUrl = computeLoginUrl();
    const authUtils = global.AuthUtils;

    if (authUtils && typeof authUtils.rememberRedirect === 'function') {
      authUtils.rememberRedirect(global.location.href);
    }

    global.location.replace(loginUrl);
  }

  function hasSession() {
    const authUtils = global.AuthUtils;
    if (authUtils && typeof authUtils.hasActiveSession === 'function') {
      return authUtils.hasActiveSession();
    }

    // Fallback für ganz alte Builds, falls AuthUtils noch nicht geladen wurde.
    try {
      return global.localStorage && global.localStorage.getItem('auth') === 'true';
    } catch (error) {
      console.error('Session check failed', error);
      return false;
    }
  }

  function computeLoginUrl() {
    if (typeof document === 'undefined') {
      return 'login.html';
    }

    const currentScript = document.currentScript;
    if (currentScript && currentScript.src) {
      const scriptUrl = new URL(currentScript.src, global.location.href);
      return new URL('login.html', scriptUrl).href;
    }

    return new URL('login.html', global.location.href).href;
  }

  function protect() {
    if (hasSession()) {
      return;
    }

    redirectToLogin();
  }

  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', protect);
  } else {
    protect();
  }
})(typeof window !== 'undefined' ? window : globalThis);
