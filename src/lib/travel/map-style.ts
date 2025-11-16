import type { StyleSpecification } from 'maplibre-gl';
import type { TravelMeta } from '../data/chile-travel/types';

export type TravelMapConfig = TravelMeta['map'] & { tileSubdomains?: string[] };

const DEFAULT_TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_GLYPHS = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';
const DEFAULT_ATTRIBUTION = '© OpenStreetMap-Mitwirkende';

/**
 * Für Einsteiger:innen: Die Experience soll überall gleich aussehen, deswegen
 * konstruieren wir die MapLibre-Styles konsequent aus der JSON-Konfiguration
 * und verzichten auf externe Style-URLs.
 */
export function resolveTileTemplates(map?: TravelMapConfig | null): string[] {
  const rawSource = map?.tileLayer;
  if (Array.isArray(rawSource)) {
    const valid = rawSource.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    if (valid.length > 0) {
      return valid;
    }
  }

  if (typeof rawSource === 'string' && rawSource.trim().length > 0) {
    if (rawSource.includes('{s}')) {
      const subdomains = map?.tileSubdomains && map.tileSubdomains.length > 0 ? map.tileSubdomains : ['a', 'b', 'c'];
      return subdomains.map((subdomain) => rawSource.replace('{s}', subdomain));
    }
    return [rawSource];
  }

  return [DEFAULT_TILE];
}

export function createRasterStyle(map?: TravelMapConfig | null): StyleSpecification {
  const tiles = resolveTileTemplates(map);
  const style: StyleSpecification = {
    version: 8,
    glyphs: map?.glyphsUrl ?? DEFAULT_GLYPHS,
    sources: {
      osm: {
        type: 'raster',
        tiles,
        tileSize: 256,
        maxzoom: 14,
        attribution: map?.attribution ?? DEFAULT_ATTRIBUTION
      }
    },
    layers: [
      {
        id: 'osm-base',
        type: 'raster',
        source: 'osm'
      }
    ]
  };

  if (map?.spriteUrl) {
    style.sprite = map.spriteUrl;
  }

  return style;
}
