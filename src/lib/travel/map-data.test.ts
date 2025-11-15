import { describe, expect, it } from 'vitest';
import { chileTravelData } from '../data/chile-travel/server';
import {
  buildSegmentCollection,
  buildStopCollection,
  collectAllCoordinates,
  type SegmentCollection,
  type StopCollection
} from './map-data';

function pickClassicalRoute() {
  return Object.values(chileTravelData.routes).find(
    (route) => Array.isArray(route?.stops) && route?.stops?.length && route?.segments?.length
  ) ?? null;
}

describe('map-data collections', () => {
  const route = pickClassicalRoute();
  const transportModes = chileTravelData.transportModes;

  it('stellt GeoJSON-Features für Segmente und Stopps bereit', () => {
    expect(route, 'Mindestens eine klassische Route sollte vorhanden sein').not.toBeNull();

    const segments: SegmentCollection = buildSegmentCollection(route, transportModes);
    const stops: StopCollection = buildStopCollection(route);

    expect(segments.features.length).toBeGreaterThan(0);
    expect(stops.features.length).toBeGreaterThan(0);

    const coordinates = collectAllCoordinates(segments, stops);
    expect(coordinates.length).toBeGreaterThanOrEqual(
      segments.features.length + stops.features.length
    );
  });
});
