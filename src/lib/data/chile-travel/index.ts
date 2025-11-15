import type { ChileTravelData, MapSettings, TravelRoute } from './types';

type RouteModule = {
  default?: TravelRoute;
  [exportName: string]: unknown;
};

const eagerRouteModules = import.meta.glob('./routes/*.ts', { eager: true }) as Record<string, RouteModule>;
const lazyRouteModules = import.meta.glob('./routes/*.ts');

const ROUTE_ORDER = ['patagonien-panorama', 'atacama-sternen', 'pazifik-genuss'];

function extractRoute(module: RouteModule): TravelRoute | null {
  if (module.default) {
    return module.default;
  }

  const fallback = Object.values(module).find((candidate): candidate is TravelRoute => {
    if (typeof candidate !== 'object' || candidate === null) return false;
    return 'id' in candidate && 'stops' in candidate;
  });

  return fallback ?? null;
}

// Für Einsteiger:innen: Die Map-Konfiguration enthält bewusst Raster-Tiles von
// OpenStreetMap. Damit bleibt die Karte DSGVO-konform, performant und kostenlos.
const chileMapSettings: MapSettings = {
  center: [-70.6693, -33.4489],
  zoom: 4.4,
  tileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; OpenStreetMap-Mitwirkende',
  legend: [
    { label: 'Aktive Route', color: '#2563eb' },
    { label: 'Alternative Route', color: '#a5b4fc' }
  ],
  mobilePadding: 120,
  maxZoom: 12
};

const travelRoutesInternal = Object.values(eagerRouteModules)
  .map((module) => extractRoute(module))
  .filter((route): route is TravelRoute => Boolean(route));

travelRoutesInternal.sort((a, b) => {
  const indexA = ROUTE_ORDER.indexOf(a.id);
  const indexB = ROUTE_ORDER.indexOf(b.id);
  const safeA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
  const safeB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;
  if (safeA !== safeB) {
    return safeA - safeB;
  }
  return a.name.localeCompare(b.name, 'de');
});

export const travelRoutes = travelRoutesInternal;

export const availableRouteIds = travelRoutesInternal.map((route) => route.id);

export const chileTravelData: ChileTravelData = {
  map: chileMapSettings,
  routes: travelRoutesInternal
};

export async function loadRouteById(id: string): Promise<TravelRoute | null> {
  const entry = Object.entries(lazyRouteModules).find(([path]) => path.includes(`/${id}.ts`));
  if (!entry) {
    return null;
  }

  const module = (await entry[1]()) as RouteModule;
  return extractRoute(module);
}

// Für Einsteiger:innen: Leaflet- und MapLibre-Hilfen nutzen dieselben GeoJSON-
// Strukturen. Damit bleiben Tests und andere Visualisierungen kompatibel.
export function buildRouteMarkerCollection(route: TravelRoute) {
  return {
    type: 'FeatureCollection',
    features: route.stops.map((stop, index) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: stop.coordinates
      },
      properties: {
        index,
        id: stop.id,
        location: stop.location,
        dayRange: stop.dayRange
      }
    }))
  } as const;
}

export function buildRouteLineCollection(route: TravelRoute) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: route.mapPolyline
        },
        properties: {
          id: route.id,
          name: route.name
        }
      }
    ]
  } as const;
}

export * from './types';
