import { describe, expect, it } from 'vitest';
import type { PageData } from './$types';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './+page';
import {
  chileTravelData,
  buildRouteMarkerCollection,
  buildRouteLineCollection,
  loadRouteById
} from '../../../lib/data/chile-travel';

// Für Einsteiger:innen: Tests helfen sicherzustellen, dass die Daten weiterhin korrekt
// in die Seite geladen werden und das GeoJSON für die Kartenansicht konsistent bleibt.
describe('travel routes page load', () => {
  it('liefert die konfigurierte Experience und alle Travel-Daten', async () => {
    const result = (await load({} as never)) as PageData;

    expect(result.experience?.id).toBe('travel-routes');
    expect(result.travel).toBe(chileTravelData);
    expect(result.travel.routes.length).toBeGreaterThan(0);
  });
});

describe('travel route geo data helpers', () => {
  it('erzeugt Marker und Linienzug aus der ersten Route', () => {
    const firstRoute = chileTravelData.routes[0];
    const markers = buildRouteMarkerCollection(firstRoute);
    const line = buildRouteLineCollection(firstRoute);

    expect(markers.features).toHaveLength(firstRoute.stops.length);
    expect(markers.features[0].geometry.type).toBe('Point');
    expect(line.features[0].geometry.type).toBe('LineString');
    expect(line.features[0].geometry.coordinates).toEqual(firstRoute.mapPolyline);
  });

  it('liefert dieselbe Route per dynamischem Loader', async () => {
    const firstRoute = chileTravelData.routes[0];
    const loadedRoute = await loadRouteById(firstRoute.id);

    expect(loadedRoute?.name).toBe(firstRoute.name);
  });
});

describe('travel routes shell', () => {
  it('stellt Karte, Routenliste und Detailbereich bereit', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(currentDir, '+page.svelte'), 'utf8');

    expect(source).toContain('id="travel-map"');
    expect(source).toContain('travel__routes');
    expect(source).toContain('Fortbewegungsmix');
    expect(source).toContain('Etappen & Aufenthalte');
  });
});
