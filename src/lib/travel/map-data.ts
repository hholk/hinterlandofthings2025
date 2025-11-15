import type { FeatureCollection, Geometry } from 'geojson';
import type {
  DailySegmentDefinition,
  DayArrivalSegment,
  DayDefinition,
  LoadedTravelRoutesDataset,
  RouteDetail,
  RouteSegment,
  RouteStop
} from '../data/chile-travel';
import type { LngLatTuple } from './map-bounds';

export interface SegmentProperties {
  id: string;
  mode: string;
  order: number;
  color: string;
  label: string;
  dashArray?: number[];
}

export interface StopProperties {
  id: string;
  name: string;
  order: number;
  label: string;
  title: string;
  subtitle?: string;
  type?: string;
}

export type SegmentCollection = FeatureCollection<Geometry, SegmentProperties>;
export type StopCollection = FeatureCollection<Geometry, StopProperties>;

export const EMPTY_SEGMENTS: SegmentCollection = { type: 'FeatureCollection', features: [] };
export const EMPTY_STOPS: StopCollection = { type: 'FeatureCollection', features: [] };

const DEFAULT_MODE = { color: '#2563eb', label: 'Segment' } as const;

function parseDashArray(value: string | null | undefined): number[] | undefined {
  if (!value) return undefined;
  const parts = value
    .split(/\s+/)
    .map((part) => Number.parseFloat(part))
    .filter((part) => Number.isFinite(part) && part > 0);
  return parts.length >= 2 ? parts : undefined;
}

export function resolveModeAppearance(
  mode: string | undefined,
  transportModes: LoadedTravelRoutesDataset['transportModes']
): Pick<SegmentProperties, 'color' | 'label' | 'dashArray'> {
  if (!mode) {
    return { ...DEFAULT_MODE };
  }

  const transport = transportModes[mode];
  if (!transport) {
    return { color: DEFAULT_MODE.color, label: mode };
  }

  return {
    color: transport.color ?? DEFAULT_MODE.color,
    label: transport.label ?? mode,
    dashArray: parseDashArray(transport.dashArray)
  };
}

function normalizeCoordinate(value: unknown): LngLatTuple | null {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 2) {
    const [lng, lat] = value;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { lat?: number; lng?: number };
    if (Number.isFinite(candidate.lng) && Number.isFinite(candidate.lat)) {
      return [candidate.lng as number, candidate.lat as number];
    }
  }
  return null;
}

function buildLineCoordinates(from: unknown, to: unknown): LngLatTuple[] | null {
  const start = normalizeCoordinate(from);
  const end = normalizeCoordinate(to);
  if (!start || !end) return null;
  return [start, end];
}

function addSegmentFeature(
  features: SegmentCollection['features'],
  geometry: GeoJSON.LineString,
  appearance: Pick<SegmentProperties, 'color' | 'label' | 'dashArray'>,
  id: string,
  mode: string,
  order: number
) {
  features.push({
    type: 'Feature',
    geometry,
    properties: {
      id,
      mode,
      order,
      color: appearance.color,
      label: appearance.label,
      ...(appearance.dashArray ? { dashArray: appearance.dashArray } : {})
    }
  });
}

export function buildSegmentCollection(
  route: RouteDetail | null,
  transportModes: LoadedTravelRoutesDataset['transportModes']
): SegmentCollection {
  if (!route) return EMPTY_SEGMENTS;

  const features: SegmentCollection['features'] = [];
  let order = 0;

  if (Array.isArray(route.mapLayers?.dailySegments) && route.mapLayers.dailySegments.length > 0) {
    route.mapLayers.dailySegments.forEach((segment: DailySegmentDefinition, index) => {
      const geometry = segment.geometry;
      if (!geometry || geometry.type !== 'LineString') return;
      const appearance = resolveModeAppearance(segment.mode, transportModes);
      addSegmentFeature(features, geometry, appearance, segment.dayId ?? `day-${index + 1}`, segment.mode ?? 'segment', order);
      order += 1;
    });
  }

  if (features.length === 0 && Array.isArray(route.segments) && Array.isArray(route.stops)) {
    const stopIndex = new Map(route.stops.map((stop) => [stop.id, stop] as const));
    route.segments.forEach((segment: RouteSegment, index) => {
      const fromStop = stopIndex.get(segment.from);
      const toStop = stopIndex.get(segment.to);
      const coordinates = buildLineCoordinates(fromStop?.coordinates, toStop?.coordinates);
      if (!coordinates) return;
      const appearance = resolveModeAppearance(segment.mode, transportModes);
      addSegmentFeature(
        features,
        { type: 'LineString', coordinates },
        appearance,
        segment.id ?? `segment-${index + 1}`,
        segment.mode ?? 'segment',
        order
      );
      order += 1;
    });
  }

  if (features.length === 0 && Array.isArray(route.days)) {
    route.days.forEach((day: DayDefinition, dayIndex) => {
      day.arrival?.segments?.forEach((segment: DayArrivalSegment, segmentIndex) => {
        const coordinates = buildLineCoordinates(segment.from?.coordinates, segment.to?.coordinates);
        if (!coordinates) return;
        const appearance = resolveModeAppearance(segment.mode, transportModes);
        addSegmentFeature(
          features,
          { type: 'LineString', coordinates },
          appearance,
          `${day.id}-segment-${segmentIndex + 1}`,
          segment.mode ?? 'segment',
          order
        );
        order += 1;
      });
    });
  }

  return { type: 'FeatureCollection', features };
}

export function buildStopCollection(route: RouteDetail | null): StopCollection {
  if (!route) return EMPTY_STOPS;
  const features: StopCollection['features'] = [];

  if (Array.isArray(route.stops) && route.stops.length > 0) {
    route.stops.forEach((stop: RouteStop, index) => {
      const coordinate = normalizeCoordinate(stop.coordinates);
      if (!coordinate) return;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coordinate
        },
        properties: {
          id: stop.id,
          name: stop.name ?? stop.city ?? `Stop ${index + 1}`,
          order: index,
          label: String(index + 1),
          title: stop.name ?? stop.city ?? stop.id,
          subtitle: stop.city ?? stop.type,
          type: stop.type
        }
      });
    });
  } else if (Array.isArray(route.days)) {
    route.days.forEach((day: DayDefinition, index) => {
      const coordinate = normalizeCoordinate(day.station?.coordinates);
      if (coordinate) {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coordinate },
          properties: {
            id: `${day.id}-station`,
            name: day.station?.name ?? `Station ${index + 1}`,
            order: index,
            label: String(index + 1),
            title: day.station?.name ?? `Station ${index + 1}`,
            subtitle: day.date,
            type: 'station'
          }
        });
      }
      day.arrival?.mapPoints?.forEach((point, pointIndex) => {
        const pointCoordinate = normalizeCoordinate(point.coordinates);
        if (!pointCoordinate) return;
        const orderValue = index + pointIndex / 10 + 0.01;
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: pointCoordinate },
          properties: {
            id: point.id,
            name: point.name ?? point.id,
            order: orderValue,
            label: String(index + 1),
            title: point.name ?? point.id,
            subtitle: point.type,
            type: point.type
          }
        });
      });
    });
  }

  return { type: 'FeatureCollection', features };
}

export function collectAllCoordinates(
  segments: SegmentCollection,
  stops: StopCollection
): LngLatTuple[] {
  const coordinates: LngLatTuple[] = [];

  for (const feature of segments.features) {
    if (feature.geometry.type === 'LineString') {
      feature.geometry.coordinates.forEach((coordinate) => {
        const normalized = normalizeCoordinate(coordinate);
        if (normalized) {
          coordinates.push(normalized);
        }
      });
    }
  }

  for (const feature of stops.features) {
    if (feature.geometry.type === 'Point') {
      const normalized = normalizeCoordinate(feature.geometry.coordinates);
      if (normalized) {
        coordinates.push(normalized);
      }
    }
  }

  return coordinates;
}
