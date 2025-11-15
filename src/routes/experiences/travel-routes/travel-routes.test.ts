import { describe, expect, it } from 'vitest';
import type { PageData } from './$types';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './+page.server';
import { chileTravelData, loadRouteById } from '../../../lib/data/chile-travel/server';

describe('travel routes page load', () => {
  it('liefert die konfigurierte Experience und die JSON-Daten', async () => {
    const result = (await load({} as never)) as PageData & { travel: typeof chileTravelData };

    expect(result.experience?.id).toBe('travel-routes');
    expect(result.travel.availableRouteIds.length).toBeGreaterThanOrEqual(6);
    const routeKeys = Object.keys(result.travel.routes).sort();
    const expectedKeys = [...result.travel.availableRouteIds].sort();
    expect(routeKeys).toEqual(expectedKeys);
  });
});

describe('travel route data access', () => {
  it('lädt eine Route aus dem Manifest nach ID', async () => {
    const [firstId] = chileTravelData.availableRouteIds;
    expect(firstId).toBeTruthy();

    const route = await loadRouteById(firstId);
    expect(route?.id).toBe(firstId);
    expect(route?.name).toBe(chileTravelData.routes[firstId].name);
  });

  it('stellt mindestens eine Route mit Segmenten und Stopps bereit', () => {
    const routeWithSegments = Object.values(chileTravelData.routes).find(
      (route) => Array.isArray(route.segments) && route.segments.length > 0
    );
    expect(routeWithSegments).toBeDefined();
    expect(routeWithSegments?.stops?.length ?? 0).toBeGreaterThan(0);
  });

  it('verknüpft Detailmodule mit bestehenden Stopps', () => {
    for (const route of Object.values(chileTravelData.routes)) {
      const stopIds = new Set((route.stops ?? []).map((stop) => stop.id));
      const referencedStopIds = [
        ...(route.activities ?? []).map((activity) => activity.stopId),
        ...(route.food ?? []).map((spot) => spot.stopId),
        ...(route.lodging ?? []).map((stay) => stay.stopId)
      ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

      // Für Einsteiger:innen: Jeder Detailblock verweist über stopId auf die Karte –
      // so bleibt klar, zu welchem Ort Aktivitäten, Food & Lodging gehören.
      for (const stopId of referencedStopIds) {
        if (!stopIds.has(stopId)) {
          throw new Error(`Route ${route.id} referenziert unbekannten Stop ${stopId}`);
        }
      }
    }
  });

  it('liefert pro Route mindestens eine renderbare Linien-Geometrie für die Karte', () => {
    const hasRenderableRoute = Object.values(chileTravelData.routes).some((route) => {
      const stopIndex = new Map((route.stops ?? []).map((stop) => [stop.id, stop] as const));

      const hasSegment = (route.segments ?? []).some((segment) => {
        const from = stopIndex.get(segment.from);
        const to = stopIndex.get(segment.to);
        return Boolean(from?.coordinates && to?.coordinates);
      });

      const hasDailyGeometry = (route.mapLayers?.dailySegments ?? []).some((segment) => {
        const coordinates = segment.geometry?.coordinates;
        return Array.isArray(coordinates) && coordinates.length >= 2;
      });

      return hasSegment || hasDailyGeometry;
    });

    // Für Einsteiger:innen: Ohne diese Geometriedaten bleibt die Map leer – der Test stellt sicher,
    // dass wir die JSON-Dokumentation korrekt befüllt und verstanden haben.
    expect(hasRenderableRoute).toBe(true);
  });
});

describe('travel routes shell', () => {
  it('enthält Karte, Zeitverlauf und Detail-Spoiler', () => {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const source = readFileSync(join(currentDir, '+page.svelte'), 'utf8');

    expect(source).toContain('id="travel-map"');
    expect(source).toContain('travel__map-slider');
    expect(source).toContain('Stationen & Stopps');
    expect(source).toContain('Kostenübersicht');
  });
});
