/**
 * Map visibility helpers for the Chile travel experience.
 * ------------------------------------------------------
 * Für Einsteiger:innen: Diese kleine Utility kapselt die Frage,
 * welchen Threshold die Karte nutzen muss, um Segmente und Stopps
 * einzublenden. Existiert kein Slider (also keine Schritte), darf
 * niemals etwas ausgeblendet werden – daher liefern wir in diesem
 * Fall bewusst einen sehr hohen Grenzwert.
 */
const ACTIVE_SEGMENT_OPACITY = 1;
const INACTIVE_SEGMENT_OPACITY = 0.7; // 30 % transparent, damit die ganze Route sichtbar bleibt.
const ACTIVE_STOP_OPACITY = 1;
const INACTIVE_STOP_OPACITY = 0.7;

export function resolveMapVisibilityThreshold(stepCount: number, sliderValue: number): number {
  if (!Number.isFinite(sliderValue)) {
    return Number.MAX_SAFE_INTEGER;
  }
  if (stepCount <= 0) {
    return Number.MAX_SAFE_INTEGER;
  }
  return sliderValue;
}

/**
 * Für Einsteiger:innen: MapLibre erwartet Expressions als verschachtelte Arrays.
 * Wir erzeugen daher einen zentralen Helfer, damit jede Komponente denselben
 * Ausdruck nutzt und die Opazität beim Slider synchron bleibt.
 */
export function createSegmentOpacityExpression(threshold: number) {
  return ['case', ['<=', ['get', 'order'], threshold], ACTIVE_SEGMENT_OPACITY, INACTIVE_SEGMENT_OPACITY] as const;
}

export function createStopOpacityExpression(threshold: number) {
  return ['case', ['<=', ['get', 'order'], threshold], ACTIVE_STOP_OPACITY, INACTIVE_STOP_OPACITY] as const;
}
