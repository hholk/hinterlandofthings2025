import { describe, it, expect } from 'vitest';
import {
  availableRouteIds,
  buildRouteLineCollection,
  buildRouteMarkerCollection,
  chileTravelData,
  loadRouteById
} from './chile-travel';

// Für Einsteiger:innen: Tests helfen uns, Datenfehler sofort zu entdecken – etwa
// fehlende Hotels oder Stops ohne Koordinaten. So bleibt die UI robust.
describe('chileTravelData', () => {
  it('enthält drei vollständig ausgearbeitete Routen', () => {
    expect(chileTravelData.routes).toHaveLength(3);
    expect(availableRouteIds).toEqual(chileTravelData.routes.map((route) => route.id));

    for (const route of chileTravelData.routes) {
      expect(route.stops.length, `${route.id} benötigt mindestens zwei Stopps`).toBeGreaterThanOrEqual(2);
      expect(route.transportMix.length, `${route.id} sollte Transportarten nennen`).toBeGreaterThan(0);
      expect(route.summary.length, `${route.id} braucht eine Beschreibung`).toBeGreaterThan(20);

      for (const stop of route.stops) {
        expect(stop.coordinates).toHaveLength(2);
        expect(stop.highlights.length, `${stop.id} sollte Highlights haben`).toBeGreaterThan(0);
        expect(stop.accommodation.length, `${stop.id} benötigt eine Unterkunftsempfehlung`).toBeGreaterThan(5);
        expect(stop.stayNights).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('lädt einzelne Routenmodule dynamisch nach', async () => {
    const [firstId] = availableRouteIds;
    const dynamicRoute = await loadRouteById(firstId);

    expect(dynamicRoute?.id).toBe(firstId);
    expect(dynamicRoute?.stops.length).toBeGreaterThan(0);
  });

  it('stellt GeoJSON-Hilfsstrukturen für Karte und Marker bereit', () => {
    const [firstRoute] = chileTravelData.routes;
    const markers = buildRouteMarkerCollection(firstRoute);
    const line = buildRouteLineCollection(firstRoute);

    expect(markers.features).toHaveLength(firstRoute.stops.length);
    expect(markers.features[0].geometry.type).toBe('Point');
    expect(line.features[0].geometry.type).toBe('LineString');
    expect(line.features[0].geometry.coordinates).toEqual(firstRoute.mapPolyline);
  });
});
