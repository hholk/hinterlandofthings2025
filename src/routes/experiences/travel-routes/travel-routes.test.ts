import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './+page';
import { chileTravelData, buildVariantGeoJSON, buildVariantLineString } from '../../../lib/data/chile-travel';

// Für Einsteiger:innen: Tests helfen sicherzustellen, dass die Daten weiterhin korrekt
// in die Seite geladen werden und das GeoJSON für die Kartenansicht konsistent bleibt.
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

describe('travel routes shell', () => {
  it('stellt Karte, Panel und Detailbereich mit Platzhaltern bereit', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(currentDir, '+page.svelte'), 'utf8');

    expect(source).toContain('id="travel-map"');
    expect(source).toContain('id="travel-route-list"');
    expect(source).toContain('Wähle eine Route aus der Liste');
    expect(source).toContain('travel-panel-toggle');
  });
});
