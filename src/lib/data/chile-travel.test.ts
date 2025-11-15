import { describe, expect, it } from 'vitest';
import { chileTravelData } from './chile-travel';

// Für Einsteiger:innen: Mit diesem Test sichern wir ab, dass alle Inhalte für die Seite vollständig bleiben.
describe('chileTravelData', () => {
  it('enthält drei Roadtrips ab Santiago', () => {
    expect(chileTravelData.roadTrips).toHaveLength(3);
    for (const trip of chileTravelData.roadTrips) {
      expect(trip.stops[0]).toBe('Santiago');
      expect(trip.distanceKm).toBeGreaterThan(0);
    }
  });

  it('liefert für jede Variante günstige Flug- und Mietwagentipps', () => {
    for (const variant of chileTravelData.variants) {
      expect(variant.budget.flights.length).toBeGreaterThan(0);
      expect(variant.budget.cars.length).toBeGreaterThan(0);
    }
  });

  it('stellt Kartenkoordinaten für jede Etappe bereit', () => {
    for (const variant of chileTravelData.variants) {
      for (const stop of variant.itinerary) {
        expect(stop.coordinates).toHaveLength(2);
        expect(Number.isFinite(stop.coordinates[0])).toBe(true);
        expect(Number.isFinite(stop.coordinates[1])).toBe(true);
      }
    }
  });
});
