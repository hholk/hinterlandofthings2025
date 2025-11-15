import { describe, it, expect } from 'vitest';
import { chileTravelData } from './chile-travel';

// Für Einsteiger:innen: Diese Tests stellen sicher, dass die Seite immer vollständige Daten erhält.
describe('chileTravelData', () => {
  it('liefert für jede Variante Flug- und Auto-Sparideen', () => {
    for (const variant of chileTravelData.variants) {
      expect(variant.budget.flights.length, `${variant.id} sollte mindestens 2 Flugtipps haben`).toBeGreaterThanOrEqual(2);
      expect(variant.budget.cars.length, `${variant.id} sollte mindestens 2 Autotipps haben`).toBeGreaterThanOrEqual(2);
    }
  });

  it('stellt drei Roadtrips von Santiago bereit', () => {
    expect(chileTravelData.roadTrips).toHaveLength(3);
    for (const trip of chileTravelData.roadTrips) {
      expect(trip.stops[0]).toBe('Santiago');
      expect(trip.stops[trip.stops.length - 1]).toBe('Santiago');
    }
  });
});
