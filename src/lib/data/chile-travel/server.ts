import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { LoadedTravelRoutesDataset, RouteDetail, RouteIndexEntry, TravelRoutesDataset } from './types';

// Für Einsteiger:innen: Die JSON-Dateien liegen außerhalb von src, damit sie
// sowohl vom statischen HTML-Demo als auch von SvelteKit genutzt werden können.
// Wir lesen sie hier direkt von der Festplatte ein – so entfällt die Abhängigkeit
// vom Vite-Importer, der Dateien innerhalb von /static blockiert.
const TRAVEL_ROUTES_ROOT = resolve(process.cwd(), 'travel-routes');

function sanitizeRelativePath(path: string): string {
  return path.replace(/^\/+/, '');
}

function readJsonFile<T>(relativePath: string): T {
  const absolutePath = resolve(TRAVEL_ROUTES_ROOT, sanitizeRelativePath(relativePath));
  const raw = readFileSync(absolutePath, 'utf8');
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new Error(`Konnte ${relativePath} nicht parsen: ${(error as Error).message}`);
  }
}

function normalizeRoute(raw: RouteDetail, entry?: RouteIndexEntry): RouteDetail | null {
  try {
    if (!raw || typeof raw.id !== 'string') {
      return null;
    }
    const route = raw;
    if (!route.name && entry?.name) {
      route.name = entry.name;
    }
    if (!route.meta && entry?.meta) {
      route.meta = { ...entry.meta };
    } else if (route.meta && entry?.meta?.durationDays && !route.meta.durationDays) {
      route.meta.durationDays = entry.meta.durationDays;
    }
    if (!route.mapFocus && entry?.mapFocus) {
      route.mapFocus = { ...entry.mapFocus };
    }
    return route;
  } catch (error) {
    console.warn('Route konnte nicht normalisiert werden', error);
    return null;
  }
}

const baseDataset = readJsonFile<TravelRoutesDataset>('travel-routes-data.json');
const routes: Record<string, RouteDetail> = {};
const filteredIndex: RouteIndexEntry[] = [];

for (const entry of baseDataset.routeIndex) {
  const routeFile = entry.file ?? `data/routes/${entry.id}.json`;
  try {
    const detail = readJsonFile<RouteDetail>(routeFile);
    const parsed = normalizeRoute(detail, entry);
    if (parsed) {
      routes[parsed.id] = parsed;
      filteredIndex.push(entry);
    }
  } catch (error) {
    console.warn(`Route ${entry.id} konnte nicht geladen werden (${routeFile})`, error);
  }
}

if (filteredIndex.length < baseDataset.routeIndex.length) {
  console.warn('Mindestens eine Route aus travel-routes-data.json fehlt und wird ausgelassen.');
}

export const availableRouteIds = filteredIndex.map((entry) => entry.id);

export const chileTravelData: LoadedTravelRoutesDataset = {
  ...baseDataset,
  routeIndex: filteredIndex,
  routes,
  availableRouteIds
};

export async function loadRouteById(id: string): Promise<RouteDetail | null> {
  return routes[id] ?? null;
}
