import type { FeatureCollection, LineString } from 'geojson';
import type { LoadedTravelRoutesDataset } from '../data/chile-travel';
import { buildSegmentCollection, type SegmentProperties } from './map-data';

export interface RouteLibraryProperties extends SegmentProperties {
  routeId: string;
}

export type RouteLibraryCollection = FeatureCollection<LineString, RouteLibraryProperties>;

/**
 * Für Einsteiger:innen: Statt jede Route einzeln zu laden, erzeugt diese
 * Funktion ein kombiniertes GeoJSON. Die Karte kann damit alle Linien gleichzeitig
 * rendern und später nur noch filtern, welche Route hervorgehoben wird.
 */
export function buildRouteSegmentLibrary(
  dataset: LoadedTravelRoutesDataset
): RouteLibraryCollection {
  const features: RouteLibraryCollection['features'] = [];

  Object.entries(dataset.routes).forEach(([routeId, route]) => {
    const segments = buildSegmentCollection(route, dataset.transportModes);
    segments.features.forEach((feature) => {
      if (feature.geometry.type !== 'LineString') return;
      features.push({
        type: 'Feature',
        geometry: feature.geometry,
        properties: {
          ...feature.properties,
          routeId
        }
      });
    });
  });

  return { type: 'FeatureCollection', features };
}
