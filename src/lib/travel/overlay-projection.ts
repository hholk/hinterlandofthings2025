import type { LngLatTuple } from './map-bounds';

export type OverlayProjector = (
  coordinate: LngLatTuple | number[] | null | undefined
) => { x: number; y: number } | null;

interface ProjectorOptions {
  paddingRatio?: number;
}

function isValidBounds(
  bounds: [LngLatTuple, LngLatTuple] | null | undefined
): bounds is [LngLatTuple, LngLatTuple] {
  if (!bounds) return false;
  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  return [minLng, minLat, maxLng, maxLat].every((value) => Number.isFinite(value));
}

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

/**
 * Erstellt einen sehr einfachen Projektor, der Lat/Lng linear auf das Canvas skaliert.
 * Damit bleibt die Route sichtbar, auch wenn MapLibre selbst keine Layer zeichnet.
 */
export function createFallbackProjector(
  bounds: [LngLatTuple, LngLatTuple] | null | undefined,
  width: number,
  height: number,
  options?: ProjectorOptions
): OverlayProjector | null {
  if (!isValidBounds(bounds)) {
    return null;
  }
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return null;
  }

  const [[minLng, minLat], [maxLng, maxLat]] = bounds;
  const lngSpan = Math.max(0.000001, maxLng - minLng);
  const latSpan = Math.max(0.000001, maxLat - minLat);
  const paddingRatio = clamp(options?.paddingRatio ?? 0.06, 0, 0.2);
  const paddingX = width * paddingRatio;
  const paddingY = height * paddingRatio;
  const usableWidth = Math.max(1, width - paddingX * 2);
  const usableHeight = Math.max(1, height - paddingY * 2);

  return (coordinate) => {
    if (!Array.isArray(coordinate) || coordinate.length < 2) return null;
    const [lng, lat] = coordinate;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    const clampedLng = clamp(lng, minLng, maxLng);
    const clampedLat = clamp(lat, minLat, maxLat);
    const relativeLng = (clampedLng - minLng) / lngSpan;
    const relativeLat = (maxLat - clampedLat) / latSpan;

    return {
      x: paddingX + relativeLng * usableWidth,
      y: paddingY + relativeLat * usableHeight
    };
  };
}
