import { describe, expect, it } from 'vitest';
import type { PageData } from './$types';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './+page';
import { chileTravelData, loadRouteById } from '../../../lib/data/chile-travel';

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
