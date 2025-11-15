import { describe, expect, it } from 'vitest';
import { chileTravelData } from '../data/chile-travel';
import {
  buildSegmentCollection,
  buildStopCollection,
  collectAllCoordinates,
  resolveModeAppearance
} from './map-data';

const transportModes = chileTravelData.transportModes;
const route = chileTravelData.routes['chile-carretera-austral'];

// Für Einsteiger:innen: Die Tests prüfen nur die Datenaufbereitung – MapLibre
// selbst wird nicht gerendert. So erkennen wir Fehler frühzeitig.
describe('map-data helpers', () => {
  it('generates segment features for known routes', () => {
    const segments = buildSegmentCollection(route, transportModes);
    expect(segments.features.length).toBeGreaterThan(0);
    segments.features.forEach((feature) => {
      expect(feature.geometry.type).toBe('LineString');
      expect(Array.isArray(feature.geometry.coordinates)).toBe(true);
    });
  });

  it('collects stop features and coordinates', () => {
    const segments = buildSegmentCollection(route, transportModes);
    const stops = buildStopCollection(route);
    expect(stops.features.length).toBeGreaterThan(0);
    const coordinates = collectAllCoordinates(segments, stops);
    expect(coordinates.length).toBeGreaterThan(0);
    coordinates.forEach(([lng, lat]) => {
      expect(typeof lng).toBe('number');
      expect(typeof lat).toBe('number');
    });
  });

  it('falls back to defaults for unknown transport modes', () => {
    const appearance = resolveModeAppearance('unknown-mode', transportModes);
    expect(appearance.color).toBe('#2563eb');
    expect(appearance.label).toBe('unknown-mode');
  });
});
