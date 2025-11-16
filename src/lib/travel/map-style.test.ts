import { describe, expect, it } from 'vitest';
import type { TravelMeta } from '../data/chile-travel/types';
import { createRasterStyle, resolveTileTemplates, type TravelMapConfig } from './map-style';

describe('map style helpers', () => {
  const baseConfig: TravelMapConfig = {
    center: [-71, -30],
    zoom: 4,
    tileLayer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  } as TravelMeta['map'];

  it('expands subdomain placeholders and arrays deterministically', () => {
    const arrayResult = resolveTileTemplates({ ...baseConfig, tileLayer: ['https://a.tile/{z}/{x}/{y}.png'] });
    expect(arrayResult).toEqual(['https://a.tile/{z}/{x}/{y}.png']);

    const subdomainResult = resolveTileTemplates({ ...baseConfig, tileLayer: 'https://{s}.tile/{z}/{x}/{y}.png', tileSubdomains: ['a', 'b'] });
    expect(subdomainResult).toEqual(['https://a.tile/{z}/{x}/{y}.png', 'https://b.tile/{z}/{x}/{y}.png']);
  });

  it('falls back to OpenStreetMap tiles when configuration is missing', () => {
    const templates = resolveTileTemplates(null);
    expect(templates).toEqual(['https://tile.openstreetmap.org/{z}/{x}/{y}.png']);
  });

  it('creates a raster style even when a styleUrl exists', () => {
    const style = createRasterStyle({ ...baseConfig, styleUrl: 'https://carto/style.json' });
    expect(style.sources?.osm?.type).toBe('raster');
    expect(style.layers?.[0]?.id).toBe('osm-base');
    expect(style.sources?.osm?.tiles).toContain('https://tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
});
