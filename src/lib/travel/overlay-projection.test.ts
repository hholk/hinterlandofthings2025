import { describe, expect, it } from 'vitest';
import type { LngLatTuple } from './map-bounds';
import { createFallbackProjector } from './overlay-projection';

describe('createFallbackProjector', () => {
  const bounds: [LngLatTuple, LngLatTuple] = [
    [-72, -35],
    [-70, -33]
  ];

  it('liefert einen Projektor für gültige Bounds', () => {
    const projector = createFallbackProjector(bounds, 200, 100);
    expect(projector).toBeTruthy();
    const origin = projector?.([-72, -35]);
    const end = projector?.([-70, -33]);
    expect(origin?.x).toBeLessThan(end?.x ?? 0);
    expect(origin?.y).toBeGreaterThan(end?.y ?? 0);
  });

  it('clamped Koordinaten bleiben im Canvas', () => {
    const projector = createFallbackProjector(bounds, 100, 50, { paddingRatio: 0 });
    const outside = projector?.([-90, -10]);
    // Für Einsteiger:innen: Canvas misst Y von oben nach unten. Punkte nördlich der Bounding-Box
    // werden deshalb am oberen Rand festgehalten (y = 0) und nicht nach unten gespiegelt.
    expect(outside).toEqual({ x: 0, y: 0 });
  });

  it('liefert null bei ungültigen Eingaben', () => {
    expect(createFallbackProjector(null, 100, 50)).toBeNull();
    expect(createFallbackProjector(bounds, 0, 10)).toBeNull();
  });
});
