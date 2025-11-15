export type LngLatTuple = [number, number];

function isValidCoordinateTuple(value: unknown): value is LngLatTuple {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [lng, lat] = value;
  return Number.isFinite(lng) && Number.isFinite(lat);
}

// Für Einsteiger:innen: Diese Utility konzentriert sich bewusst auf eine
// Aufgabe – aus einer Liste von Koordinaten wird die minimale Bounding-Box
// berechnet. So bleibt die Logik leicht testbar und unabhängig von MapLibre.
export function calculateBoundingBox(coordinates: LngLatTuple[]): [LngLatTuple, LngLatTuple] | null {
  const validCoordinates = coordinates.filter((coordinate) => isValidCoordinateTuple(coordinate));
  if (validCoordinates.length === 0) return null;

  let [minLng, minLat] = validCoordinates[0];
  let [maxLng, maxLat] = validCoordinates[0];

  for (const [lng, lat] of validCoordinates) {
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
