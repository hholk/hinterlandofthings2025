/**
 * Für Einsteiger:innen: Diese Adapter-Optionen sorgen dafür,
 * dass GitHub Pages bei Direktaufrufen (z. B. /experiences/travel-routes)
 * immer unsere gebaute App liefert. Die Datei 404.html dient als Fallback,
 * weil GitHub Pages automatisch darauf zurückfällt, wenn eine Route fehlt.
 */
export const adapterOptions = {
  fallback: '404.html'
};
