import datasetModule from '../../../../travel-routes/travel-routes-data.json';
import type { LoadedTravelRoutesDataset, RouteDetail, RouteIndexEntry, TravelRoutesDataset } from './types';

const routeModules = import.meta.glob('../../../../travel-routes/data/routes/*.json', {
  eager: true
}) as Record<string, RouteDetail>;

function parseRoute(raw: RouteDetail): RouteDetail | null {
  try {
    const parsed = raw;
    if (parsed && typeof parsed.id === 'string') {
      if (!parsed.name && typeof (parsed as { title?: string }).title === 'string') {
        parsed.name = (parsed as { title?: string }).title as string;
      }
      return parsed;
    }
  } catch (error) {
    console.warn('Route konnte nicht geparst werden', error);
  }
  return null;
}

const routes: Record<string, RouteDetail> = {};
for (const raw of Object.values(routeModules)) {
  const route = parseRoute(raw);
  if (route) {
    routes[route.id] = route;
  }
}

function parseDataset(raw: TravelRoutesDataset): TravelRoutesDataset {
  try {
    return raw;
  } catch (error) {
    console.warn('Konnte travel-routes-data.json nicht parsen', error);
    throw error;
  }
}

const baseDataset = parseDataset(datasetModule);

const filteredIndex: RouteIndexEntry[] = baseDataset.routeIndex.filter((entry) => {
  if (routes[entry.id]) return true;
  console.warn(`Route ${entry.id} fehlt im Datensatz und wird übersprungen.`);
  return false;
});

for (const entry of filteredIndex) {
  const route = routes[entry.id];
  if (!route) continue;
  if (!route.name && entry.name) {
    route.name = entry.name;
  }
  if (!route.meta && entry.meta) {
    route.meta = { ...entry.meta };
  } else if (route.meta && entry.meta?.durationDays && !route.meta.durationDays) {
    route.meta.durationDays = entry.meta.durationDays;
  }
}

const availableRouteIds = filteredIndex.map((entry) => entry.id);

// Für Einsteiger:innen: Wir kombinieren das Index-Manifest mit den einzelnen
// JSON-Dateien. `import.meta.glob` beobachtet den Ordner – neue Dateien werden
// automatisch eingebunden, ohne dass zusätzlicher Code nötig ist.
export const chileTravelData: LoadedTravelRoutesDataset = {
  ...baseDataset,
  routeIndex: filteredIndex,
  routes,
  availableRouteIds
};

export { availableRouteIds };

export async function loadRouteById(id: string): Promise<RouteDetail | null> {
  return routes[id] ?? null;
}

export * from './types';
