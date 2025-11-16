import { describe, expect, it } from 'vitest';
import { calculateBoundingBox } from './map-bounds';

describe('calculateBoundingBox', () => {
  it('ermittelt minimale und maximale Koordinaten', () => {
    const boundingBox = calculateBoundingBox([
      [-70.5, -32.3],
      [-70.9, -32.6],
      [-71.2, -33.1],
      [-72.4, -34.2]
    ]);

    expect(boundingBox).toEqual([
      [-72.4, -34.2],
      [-70.5, -32.3]
    ]);
  });

  it('filtert ungültige Koordinaten heraus', () => {
    const boundingBox = calculateBoundingBox([
      [-70.5, -32.3],
      [Number.NaN, 10],
      [100, Number.NaN]
    ]);

    expect(boundingBox).toEqual([
      [-70.5, -32.3],
      [-70.5, -32.3]
    ]);
  });

  it('gibt null für leere Listen zurück', () => {
    expect(calculateBoundingBox([])).toBeNull();
  });
});
