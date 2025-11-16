/**
 * Timeline helpers for the Chile travel experience.
 * -------------------------------------------------
 * Diese Datei bündelt kleine, leicht testbare Funktionen rund um den
 * Zeitstrahl der Karte. Dank der Auslagerung lassen sich die Regeln der
 * Map-Komponente ohne DOM direkt mit Vitest prüfen – ideal für Einsteiger:innen.
 */

export interface TimelineStepLike {
  order: number;
  label: string;
  description?: string;
}

/**
 * Liefert den Index, der die komplette Route zeigt.
 * Für Einsteiger:innen: Sobald eine Route mehrere Schritte besitzt,
 * möchten wir standardmäßig den letzten Schritt aktivieren, damit
 * alle Segmente sichtbar sind. Gibt es keine Schritte, fällt der
 * Index automatisch auf 0 zurück – so bleibt der Slider gültig.
 */
export function getDefaultSliderIndex(steps: TimelineStepLike[] | undefined | null): number {
  if (!Array.isArray(steps) || steps.length === 0) {
    return 0;
  }
  return steps.length - 1;
}
