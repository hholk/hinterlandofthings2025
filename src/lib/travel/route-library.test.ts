import { describe, expect, it } from 'vitest';
import { buildRouteSegmentLibrary } from './route-library';
import { chileTravelData } from '../data/chile-travel/server';

describe('route segment library', () => {
  it('stellt für jede Route mindestens ein Linien-Feature bereit', () => {
    const library = buildRouteSegmentLibrary(chileTravelData);

    expect(library.features.length).toBeGreaterThan(0);

    for (const routeId of chileTravelData.availableRouteIds) {
      const hasFeature = library.features.some(
        (feature) => feature.properties?.routeId === routeId
      );
      expect(hasFeature).toBe(true);
    }
  });
});
