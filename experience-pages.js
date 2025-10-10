(function (global) {
  /**
   * Diese Konfiguration beschreibt alle Unterseiten, die nach dem Login erreichbar
   * sein sollen. Wir kapseln die Daten an einer Stelle, damit sowohl die
   * Startseite als auch die Login-Seite dieselben Informationen nutzen können.
   * Für Einsteiger:innen: Statt mehrfach denselben HTML-Code zu pflegen,
   * hinterlegen wir die Daten einmal in diesem Array und generieren die Karten
   * anschließend per JavaScript. So bleibt alles leichter wartbar.
   */
  const pages = [
    {
      id: 'hinterland',
      href: 'hinterland.html',
      title: 'Hinterland of Things 2025',
      description: 'Agenda, Favoriten und Markdown-Briefings in einem klaren Zwei-Spalten-Layout.',
      icon: `<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <circle cx="32" cy="20" r="12" stroke="currentColor" stroke-width="4" fill="none" />
        <rect x="24" y="32" width="16" height="20" rx="8" />
        <line x1="32" y1="52" x2="32" y2="60" stroke="currentColor" stroke-width="4" />
      </svg>`
    },
    {
      id: 'universal-home',
      href: 'universal-home.html',
      title: 'Universal Home',
      description: 'Filterbare Sessions mit passenden Farben für Präsentationen, Q&A und Networking.',
      icon: `<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <path d="M8 32 L32 12 L56 32 V56 H40 V40 H24 V56 H8 Z" stroke="currentColor" stroke-width="4" fill="none" />
      </svg>`
    },
    {
      id: 'universal-timeslots',
      href: 'universal-home-timeslots.html',
      title: 'Universal Home Zeitplan',
      description: 'Scrollbarer Kalender mit Overlay-Karten in derselben Glas-Optik.',
      icon: `<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <rect x="8" y="8" width="48" height="48" rx="6" ry="6" stroke="currentColor" stroke-width="4" fill="none" />
        <line x1="16" y1="24" x2="48" y2="24" stroke="currentColor" stroke-width="4" />
        <line x1="16" y1="34" x2="48" y2="34" stroke="currentColor" stroke-width="4" />
      </svg>`
    },
    {
      id: 'miele-analysis',
      href: 'miele-analysis.html',
      title: 'Miele Analyse',
      description: 'Lesefreundliche Artikelansicht mit interaktiver Tabelle für Szenarien.',
      icon: `<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="4" fill="none" />
        <path d="M16 32h32" stroke="currentColor" stroke-width="4" />
      </svg>`
    },
    {
      id: 'portfolio',
      href: 'portfolio-henrik/index.html',
      title: 'Portfolio',
      description: 'Direkter Zugang zum Portfolio – bleibt bewusst im selben Look eingebettet.',
      icon: `<svg width="32" height="32" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
        <rect x="12" y="20" width="40" height="32" rx="4" ry="4" stroke="currentColor" stroke-width="4" fill="none" />
        <path d="M24 20v-4a8 8 0 0 1 16 0v4" stroke="currentColor" stroke-width="4" fill="none" />
        <line x1="12" y1="32" x2="52" y2="32" stroke="currentColor" stroke-width="4" />
      </svg>`
    }
  ];

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = pages;
  }

  global.EXPERIENCE_PAGES = pages;
})(typeof window !== 'undefined' ? window : globalThis);
