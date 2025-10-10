(function (global) {
  const DEFAULT_TILT_OPTIONS = {
    max: 8,
    speed: 400,
    glare: true,
    'max-glare': 0.35,
    scale: 1.02
  };

  /**
   * Erstellt den HTML-Inhalt für eine einzelne Feature-Karte. Der Code ist als
   * Funktion gekapselt, sodass wir ihn sowohl in der Browser-Laufzeit als auch
   * in Unit-Tests wiederverwenden können. Für Anfänger:innen: Wir erzeugen hier
   * bewusst einen String statt direkt DOM-Knoten, weil das Testing in Node so
   * ohne zusätzliche Abhängigkeiten (z.B. JSDOM) auskommt.
   */
  const createFeatureCardHTML = (page) => {
    return `
      <a href="${page.href}" class="feature-card" data-page-id="${page.id}">
        <span class="feature-icon" aria-hidden="true">${page.icon}</span>
        <div class="feature-copy">
          <h2>${page.title}</h2>
          <p>${page.description}</p>
        </div>
        <span class="feature-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </a>
    `;
  };

  /**
   * Rendert alle Feature-Karten in den angegebenen Container. Wir akzeptieren
   * optional Konfigurationsoptionen, um z.B. unterschiedliche Tilt-Effekte für
   * Desktop und Mobile zu verwenden.
   */
  const renderExperienceCards = (container, pages = [], options = {}) => {
    if (!container) {
      return;
    }

    container.innerHTML = pages.map(createFeatureCardHTML).join('');

    const tiltOptions = { ...DEFAULT_TILT_OPTIONS, ...options.tilt };
    const cards = container.querySelectorAll('.feature-card');

    if (cards.length && typeof global.VanillaTilt !== 'undefined') {
      global.VanillaTilt.init(cards, tiltOptions);
    }
  };

  const api = {
    renderExperienceCards,
    createFeatureCardHTML
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  global.ExperienceUI = api;
})(typeof window !== 'undefined' ? window : globalThis);
