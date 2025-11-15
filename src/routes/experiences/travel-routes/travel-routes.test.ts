import { describe, expect, it } from 'vitest';
import { load } from './+page';
import { chileTravelData, buildVariantGeoJSON, buildVariantLineString } from '../../../lib/data/chile-travel';

// Für Einsteiger:innen: Tests helfen sicherzustellen, dass die Daten weiterhin korrekt
// in die Seite geladen werden und das GeoJSON für MapLibre konsistent bleibt.
describe('travel routes page load', () => {
  it('liefert die konfigurierte Experience und alle Travel-Daten', async () => {
    const result = await load({} as never);

    expect(result.experience?.id).toBe('travel-routes');
    expect(result.travel).toBe(chileTravelData);
    expect(result.travel.variants.length).toBeGreaterThan(0);
    expect(result.travel.roadTrips).toHaveLength(3);
  });
});

describe('travel route geo data helpers', () => {
  it('erzeugt pro Stopp einen Punkt und eine durchgehende Linie', () => {
    const firstVariant = chileTravelData.variants[0];
    const geoPoints = buildVariantGeoJSON(firstVariant);
    const geoLine = buildVariantLineString(firstVariant);

    expect(geoPoints.features).toHaveLength(firstVariant.itinerary.length);
    expect(geoLine.features[0].geometry.type).toBe('LineString');
    expect(geoLine.features[0].geometry.coordinates).toHaveLength(firstVariant.itinerary.length);
  });
});
