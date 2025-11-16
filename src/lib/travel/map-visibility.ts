/**
 * Map visibility helpers for the Chile travel experience.
 * ------------------------------------------------------
 * Für Einsteiger:innen: Diese kleine Utility kapselt die Frage,
 * welchen Threshold die Karte nutzen muss, um Segmente und Stopps
 * einzublenden. Existiert kein Slider (also keine Schritte), darf
 * niemals etwas ausgeblendet werden – daher liefern wir in diesem
 * Fall bewusst einen sehr hohen Grenzwert.
 */
export function resolveMapVisibilityThreshold(stepCount: number, sliderValue: number): number {
  if (!Number.isFinite(sliderValue)) {
    return Number.MAX_SAFE_INTEGER;
  }
  if (stepCount <= 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  return sliderValue;
}
