import { describe, expect, it } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { availableRouteIds, chileTravelData, loadRouteById } from './chile-travel/server';
import type { RouteDetail } from './chile-travel';

const ROUTE_DATA_DIR = join(process.cwd(), 'travel-routes', 'data', 'routes');

// Für Einsteiger:innen: Die Tests überprüfen, dass wirklich alle JSON-Dateien
// in den Datensatz einfließen. Sobald ein neues File im Ordner liegt, darf der
// Index nicht veralten.
describe('chileTravelData dataset', () => {
  it('lädt das Index-Manifest inklusive aller verfügbaren Routen', () => {
    expect(chileTravelData.routeIndex.length).toBeGreaterThanOrEqual(6);
    expect(chileTravelData.availableRouteIds).toEqual(availableRouteIds);

    for (const entry of chileTravelData.routeIndex) {
      const route = chileTravelData.routes[entry.id];
      expect(route, `${entry.id} sollte in routes verfügbar sein`).toBeDefined();
      expect(route?.name).toBeTruthy();
      expect(route?.meta?.durationDays).toBeGreaterThan(0);
    }
  });

  it('stellt Metadaten und Transportarten bereit', () => {
    expect(chileTravelData.meta.title.length).toBeGreaterThan(10);
    const modeKeys = Object.keys(chileTravelData.transportModes);
    expect(modeKeys.length).toBeGreaterThanOrEqual(3);
    modeKeys.forEach((key) => {
      const mode = chileTravelData.transportModes[key];
      expect(mode.label).toBeTruthy();
      expect(typeof mode.color).toBe('string');
    });
  });

  it('synchronisiert Route-IDs zwischen Index und routes-Map', () => {
    const idsFromRoutes = Object.keys(chileTravelData.routes).sort();
    const idsFromIndex = [...chileTravelData.availableRouteIds].sort();

    expect(idsFromRoutes).toEqual(idsFromIndex);
  });

  it('liefert beim Beispielroute-Slider Tagessegmente', () => {
    const example = chileTravelData.routes['example-andes-pacific'];
    expect(example, 'Beispielroute fehlt').toBeDefined();
    expect(Array.isArray(example?.days)).toBe(true);
    expect(example?.days?.length).toBe(3);
    expect(example?.mapLayers?.dailySegments?.length).toBe(example?.days?.length);
  });

  it('bindet jede JSON-Datei aus travel-routes/data/routes ein', () => {
    const files = readdirSync(ROUTE_DATA_DIR).filter((file) => file.endsWith('.json'));
    const idsFromFiles = files.map((file) => file.replace(/\.json$/u, ''));

    // Für Einsteiger:innen: So stellen wir sicher, dass das Manifest nicht
    // veraltet. Jeder neue JSON-Slug muss automatisch verfügbar sein.
    idsFromFiles.forEach((id) => {
      expect(chileTravelData.availableRouteIds).toContain(id);
      expect(chileTravelData.routes[id]).toBeDefined();
    });
  });
});

describe('loadRouteById', () => {
  it('gibt denselben Routen-Eintrag zurück, den auch das Manifest nutzt', async () => {
    const [firstId] = availableRouteIds;
    expect(firstId).toBeTruthy();

    const route = await loadRouteById(firstId);
    expect(route?.id).toBe(firstId);
    expect(route?.name).toBe(chileTravelData.routes[firstId].name);
  });

  it('liefert null für unbekannte IDs', async () => {
    const route = await loadRouteById('unbekannt');
    expect(route).toBeNull();
  });
});

// Hilfsprüfung: Mindestens eine Route besitzt klassische Segmente & Stopps –
// dadurch stellen wir sicher, dass die Karte immer Daten für Marker erhält.
describe('route structure sanity checks', () => {
  function hasStops(route: RouteDetail | undefined): boolean {
    return Array.isArray(route?.stops) && route?.stops?.length > 0;
  }

  it('mindestens eine Route enthält Stopps und Segmente', () => {
    const routeWithStops = Object.values(chileTravelData.routes).find((route) => hasStops(route));
    expect(routeWithStops, 'Es sollte mindestens eine klassische Route geben').toBeDefined();
    expect(routeWithStops?.segments?.length).toBeGreaterThan(0);
  });
});
