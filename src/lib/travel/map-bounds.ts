import type { TravelRoute } from '../data/chile-travel';

export type LngLatTuple = [number, number];

// Für Einsteiger:innen: Diese Datei kapselt alle Berechnungen rund um die
// Bounding-Box. So können wir die Logik in Unit-Tests prüfen, ohne MapLibre in
// einer Testumgebung starten zu müssen.
function isValidCoordinateTuple(value: unknown): value is LngLatTuple {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [lng, lat] = value;
  return Number.isFinite(lng) && Number.isFinite(lat);
}

export function collectRouteCoordinates(route: Pick<TravelRoute, 'mapPolyline' | 'stops'>): LngLatTuple[] {
  const collected: LngLatTuple[] = [];

  for (const point of route.mapPolyline ?? []) {
    if (isValidCoordinateTuple(point)) {
      collected.push([point[0], point[1]]);
    }
  }

  for (const stop of route.stops ?? []) {
    if (isValidCoordinateTuple(stop.coordinates)) {
      collected.push([stop.coordinates[0], stop.coordinates[1]]);
    }
  }

  return collected;
}

export function calculateBoundingBox(coordinates: LngLatTuple[]): [LngLatTuple, LngLatTuple] | null {
  if (coordinates.length === 0) return null;

  let minLng = coordinates[0][0];
  let maxLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLat = coordinates[0][1];

  for (const [lng, lat] of coordinates) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}
