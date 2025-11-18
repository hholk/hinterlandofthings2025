// Für Einsteiger:innen: Diese Typdefinitionen beschreiben den reichhaltigen
// JSON-Datensatz der Chile-Reiserouten. Durch die Interfaces erkennt der Editor
// automatisch alle Felder – so lassen sich Tippfehler und fehlende Angaben früh
// entdecken.

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ResourceImage {
  url: string;
  caption?: string;
  credit?: string;
  license?: string;
}

export interface HighlightImage {
  title: string;
  image: string;
  caption?: string;
  source?: string;
  sourceUrl?: string;
  license?: string;
}

export interface RouteStop {
  id: string;
  name: string;
  type?: string;
  city?: string;
  address?: {
    street?: string;
    city?: string;
    country?: string;
  };
  website?: string;
  openingHours?: string;
  description?: string;
  timezone?: string;
  rating?: number;
  reviewCount?: number;
  photos?: ResourceImage[];
  notes?: string[];
  coordinates: Coordinates;
  [key: string]: unknown;
}

export interface RouteSegment {
  id: string;
  from: string;
  to: string;
  mode: string;
  operator?: string;
  distanceKm?: number;
  durationHours?: number;
  carbonKg?: number;
  description?: string;
  [key: string]: unknown;
}

export interface RouteMeta {
  theme?: string;
  pace?: string;
  durationDays?: number;
  costEstimate?: number;
  highlights?: string[];
  highlightImages?: HighlightImage[];
  scores?: Record<string, number>;
}

export interface RouteMapFocus {
  center: [number, number];
  zoom?: number;
  region?: string;
  description?: string;
}

export interface RouteMetrics {
  totalDistanceKm?: number;
  estimatedCarbonKg?: number;
  segmentCount?: number;
  flightCount?: number;
  stopCount?: number;
  totalNights?: number;
  avgNightlyRate?: number;
  lodgingCount?: number;
  foodCount?: number;
  activityCount?: number;
  averageDailyBudget?: number;
  groundTransportCarbonKg?: number;
  [key: string]: number | undefined;
}

export interface CostBreakdownEntry {
  category: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface FlightInfo {
  id?: string;
  fromStopId: string;
  toStopId: string;
  airline?: string;
  price?: number;
  currency?: string;
  aircraft?: string;
  cabinClass?: string;
  baggage?: string;
  carbonKg?: number;
  durationHours?: number;
  notes?: string;
  [key: string]: unknown;
}

export interface LodgingInfo {
  id?: string;
  name: string;
  stopId?: string;
  city?: string;
  nights?: number;
  pricePerNight?: number;
  currency?: string;
  amenities?: string[];
  url?: string;
  description?: string;
  images?: ResourceImage[];
  [key: string]: unknown;
}

export interface FoodInfo {
  id?: string;
  name: string;
  stopId?: string;
  city?: string;
  mustTry?: string[];
  priceRange?: string;
  images?: ResourceImage[];
  description?: string;
  [key: string]: unknown;
}

export interface ActivityRestaurant {
  name: string;
  images?: ResourceImage[];
  [key: string]: unknown;
}

export interface ActivityInfo {
  id?: string;
  title?: string;
  name?: string;
  stopId?: string;
  location?: string;
  durationHours?: number;
  difficulty?: string;
  price?: number;
  currency?: string;
  website?: string;
  description?: string;
  images?: ResourceImage[];
  category?: string;
  restaurants?: ActivityRestaurant[];
  [key: string]: unknown;
}

export interface MobilityOption {
  label?: string;
  summary?: string;
  price?: number;
  currency?: string;
  durationMinutes?: number;
  frequencyMinutes?: number;
  distanceKm?: number;
  images?: ResourceImage[];
  [key: string]: unknown;
}

export interface MobilityVariant {
  id: string;
  mode: string;
  cost?: number;
  durationMinutes?: number;
  co2?: number;
  description?: string;
  geometry?: DailySegmentGeometry;
  [key: string]: unknown;
}

export interface DayArrivalSegment {
  mode?: string;
  description?: string;
  durationMinutes?: number;
  distanceKm?: number;
  from?: {
    name?: string;
    coordinates?: Coordinates;
  };
  to?: {
    name?: string;
    coordinates?: Coordinates;
  };
  images?: ResourceImage[];
  variants?: MobilityVariant[];
  [key: string]: unknown;
}

export interface DayArrival {
  segments?: DayArrivalSegment[];
  mapPoints?: Array<{
    id: string;
    type?: string;
    name?: string;
    coordinates?: Coordinates;
    images?: ResourceImage[];
    description?: string;
    [key: string]: unknown;
  }>;
}

export interface DayDefinition {
  id: string;
  date?: string;
  station?: {
    name?: string;
    timezone?: string;
    coordinates?: Coordinates;
    description?: string;
    images?: ResourceImage[];
  };
  arrival?: DayArrival;
  activities?: Array<{
    name?: string;
    description?: string;
    images?: ResourceImage[];
    restaurants?: ActivityRestaurant[];
    [key: string]: unknown;
  }>;
  hotels?: LodgingInfo[];
  mobilityOptions?: {
    nextFlight?: MobilityOption;
    nextBus?: MobilityOption;
    nextDrive?: MobilityOption;
    [key: string]: MobilityOption | undefined;
  };
  [key: string]: unknown;
}

export interface DailySegmentGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

export interface DailySegmentDefinition {
  dayId?: string;
  mode?: string;
  geometry?: DailySegmentGeometry;
  [key: string]: unknown;
}

export interface RouteDetail {
  id: string;
  name: string;
  summary?: string;
  color?: string;
  tags?: string[];
  meta?: RouteMeta;
  metrics?: RouteMetrics;
  notes?: string;
  costBreakdown?: CostBreakdownEntry[];
  stops?: RouteStop[];
  segments?: RouteSegment[];
  flights?: FlightInfo[];
  lodging?: LodgingInfo[];
  food?: FoodInfo[];
  activities?: ActivityInfo[];
  days?: DayDefinition[];
  mapLayers?: {
    dailySegments?: DailySegmentDefinition[];
  };
  mapFocus?: RouteMapFocus;
  source?: string;
  [key: string]: unknown;
}

export interface RouteIndexEntry {
  id: string;
  file: string;
  name: string;
  summary: string;
  color?: string;
  tags?: string[];
  meta?: RouteMeta;
  metrics?: RouteMetrics;
  searchTokens?: string[];
  mapFocus?: RouteMapFocus;
}

export interface TransportMode {
  label: string;
  color: string;
  icon?: string;
  dashArray?: string | null;
  description?: string;
  averageSpeedKmh?: number;
  carbonPerKm?: number;
}

export interface TravelMeta {
  title: string;
  subtitle?: string;
  defaultDurationDays?: number;
  currency?: string;
  editor?: Record<string, unknown>;
  map: {
    center: [number, number];
    zoom: number;
    tileLayer: string;
    styleUrl?: string;
    glyphsUrl?: string;
    spriteUrl?: string;
    attribution?: string;
  };
}

export interface TravelRoutesDataset {
  meta: TravelMeta;
  transportModes: Record<string, TransportMode>;
  routeIndex: RouteIndexEntry[];
  suggestionLibrary?: Array<Record<string, unknown>>;
  templates?: Record<string, unknown>;
  poiOverview?: Record<string, unknown>;
}

export interface LoadedTravelRoutesDataset extends TravelRoutesDataset {
  routes: Record<string, RouteDetail>;
  availableRouteIds: string[];
}
