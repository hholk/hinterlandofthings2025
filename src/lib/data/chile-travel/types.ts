// Für Einsteiger:innen: Diese Typdefinitionen beschreiben alle Datenfelder der
// Chile-Reiserouten. Sie dienen sowohl der Autovervollständigung als auch den
// Tests – wenn ein Feld fehlt, schlägt der Build direkt fehl.
export interface RouteStop {
  /** Kennung für Tests und potentielle Deep-Links */
  id: string;
  /** Beispielsweise "Tag 1-2" – so erkennen Besucher:innen sofort den Rhythmus. */
  dayRange: string;
  location: string;
  stayNights: number;
  description: string;
  transportMode: string;
  travelDistanceKm: number;
  travelDurationHours: number;
  accommodation: string;
  highlights: string[];
  coordinates: [number, number];
}

export interface RouteEssentials {
  bestSeason: string;
  budgetPerPersonEUR: string;
  pace: 'entspannt' | 'aktiv' | 'intensiv';
  recommendedFor: string[];
}

export interface TravelRoute {
  id: string;
  name: string;
  tagline: string;
  totalDays: number;
  totalDistanceKm: number;
  transportMix: string[];
  color: string;
  summary: string;
  mapPolyline: [number, number][];
  stops: RouteStop[];
  essentials: RouteEssentials;
}

export interface MapLegendEntry {
  label: string;
  color: string;
}

export interface MapSettings {
  center: [number, number];
  zoom: number;
  tileUrl: string;
  attribution: string;
  legend: MapLegendEntry[];
  /** Optional zusätzliche Puffer für das automatische Zoomen auf Mobile. */
  mobilePadding?: number;
  maxZoom?: number;
}

export interface ChileTravelData {
  map: MapSettings;
  routes: TravelRoute[];
}
