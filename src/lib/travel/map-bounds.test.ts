import { describe, expect, it } from 'vitest';
import type { RouteStop } from '../data/chile-travel';
import { calculateBoundingBox, collectRouteCoordinates } from './map-bounds';

const createStop = (coordinates: [number, number], overrides: Partial<RouteStop> = {}): RouteStop => ({
  id: overrides.id ?? 'stop-id',
  dayRange: overrides.dayRange ?? 'Tag 1',
  location: overrides.location ?? 'Patagonien',
  stayNights: overrides.stayNights ?? 1,
  description: overrides.description ?? 'Station zum Testen',
  transportMode: overrides.transportMode ?? 'Bus',
  travelDistanceKm: overrides.travelDistanceKm ?? 0,
  travelDurationHours: overrides.travelDurationHours ?? 0,
  accommodation: overrides.accommodation ?? 'Lodge',
  highlights: overrides.highlights ?? ['Highlight'],
  coordinates
});

describe('collectRouteCoordinates', () => {
  it('gibt Polyline- und Stop-Koordinaten in einer flachen Liste zurück', () => {
    const coordinates = collectRouteCoordinates({
      mapPolyline: [
        [-70.5, -32.3],
        [-70.9, -32.6]
      ],
      stops: [createStop([-71.2, -33.1]), createStop([-72.4, -34.2], { id: 'zweiter-stop' })]
    });

    expect(coordinates).toEqual([
      [-70.5, -32.3],
      [-70.9, -32.6],
      [-71.2, -33.1],
      [-72.4, -34.2]
    ]);
  });
});

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

  it('gibt null für leere Koordinatenlisten zurück', () => {
    expect(calculateBoundingBox([])).toBeNull();
  });
});
