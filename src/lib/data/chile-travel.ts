// Für Einsteiger:innen: In dieser Datei sammeln wir alle Reiseinhalte für die Chile-Seite.
// Die UI kann damit komplett datengetrieben bleiben und muss lediglich diese Struktur rendern.

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
}

export interface ChileTravelData {
  map: MapSettings;
  routes: TravelRoute[];
}

// Für Einsteiger:innen: Dieses Objekt wird von der Seite importiert und enthält bereits
// alle Texte, Koordinaten und Logistik-Infos. Änderungen hier aktualisieren automatisch die UI.
export const chileTravelData: ChileTravelData = {
  map: {
    center: [-70.6693, -33.4489],
    zoom: 4.4,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap-Mitwirkende',
    legend: [
      { label: 'Aktive Route', color: '#2563eb' },
      { label: 'Alternative Route', color: '#a5b4fc' }
    ]
  },
  routes: [
    {
      id: 'patagonien-panorama',
      name: 'Patagonien Panorama',
      tagline: 'Von den Seen Chiles bis zu den Granittürmen im Süden',
      totalDays: 16,
      totalDistanceKm: 3450,
      transportMix: ['Langstreckenflug', 'Inlandsflug', 'Mietwagen', 'Fährfahrt'],
      color: '#2563eb',
      summary:
        'Kombiniere die chilenische Seenplatte mit Fjorden und dem Torres-del-Paine-Nationalpark – perfekt für Abenteurer:innen, die Fahrtstrecken lieben.',
      mapPolyline: [
        [-70.6693, -33.4489],
        [-71.9545, -39.2822],
        [-72.9854, -41.3184],
        [-72.568, -44.321],
        [-72.506, -51.7295],
        [-72.9996, -50.9423],
        [-70.6693, -33.4489]
      ],
      stops: [
        {
          id: 'scl-arrival',
          dayRange: 'Tag 1-2',
          location: 'Santiago de Chile',
          stayNights: 2,
          description:
            'Streetfood-Tour durch Bellavista, Rooftop-Sundowner und erster Überblick über die Reise.',
          transportMode: 'Langstreckenflug nach Santiago',
          travelDistanceKm: 0,
          travelDurationHours: 0,
          accommodation: 'Hotel Magnolia – Boutiquehotel im Barrio Lastarria',
          highlights: ['Sky Costanera Viewdeck', 'Pisco Sour Kurs'],
          coordinates: [-70.6693, -33.4489]
        },
        {
          id: 'pucon-villarrica',
          dayRange: 'Tag 3-5',
          location: 'Pucón & Villarrica',
          stayNights: 3,
          description:
            'Thermalquellen, Mapuche-Küche und geführte Vulkanbesteigung mit Steigeisen und Guide.',
          transportMode: 'Inlandsflug nach Temuco + Mietwagen',
          travelDistanceKm: 780,
          travelDurationHours: 5.5,
          accommodation: 'Hotel Antumalal – Bungalows mit Seeblick',
          highlights: ['Geothermales Spa', 'Villarrica-Sonnenaufgang'],
          coordinates: [-71.9545, -39.2822]
        },
        {
          id: 'puerto-varas',
          dayRange: 'Tag 6-7',
          location: 'Puerto Varas',
          stayNights: 2,
          description:
            'Kajaktour am Llanquihue-See, Abstecher auf die Insel Chiloé und Kaffeerösterei-Besuch.',
          transportMode: 'Mietwagen',
          travelDistanceKm: 310,
          travelDurationHours: 4,
          accommodation: 'Hotel Awa – Designhotel mit Vulkanblick',
          highlights: ['Osorno Vulkanpass', 'Holzkirchen von Chiloé'],
          coordinates: [-72.9854, -41.3184]
        },
        {
          id: 'carretera-austral',
          dayRange: 'Tag 8-9',
          location: 'Carretera Austral Nord',
          stayNights: 2,
          description:
            'Roadtrip nach Puyuhuapi mit Hängegletscher, Fjordblicken und traditionellem Curanto.',
          transportMode: 'Fährfahrt + Mietwagen',
          travelDistanceKm: 520,
          travelDurationHours: 8,
          accommodation: 'Lodge El Pangue – Fjordlodge mit Spa',
          highlights: ['Queulat Hängegletscher', 'Thermalquellen von Puyuhuapi'],
          coordinates: [-72.568, -44.321]
        },
        {
          id: 'puerto-natales',
          dayRange: 'Tag 10-12',
          location: 'Puerto Natales',
          stayNights: 3,
          description:
            'Fjordcruise zu den Balmaceda-Gletschern, Besuch einer Estancia und Patagonien-Küche.',
          transportMode: 'Inlandsflug Puerto Montt → Punta Arenas + Bus',
          travelDistanceKm: 1350,
          travelDurationHours: 6.5,
          accommodation: 'The Singular Patagonia – historisches Werft-Hotel',
          highlights: ['Gletscher-Bootstrip', 'Patagonisches Asado'],
          coordinates: [-72.506, -51.7295]
        },
        {
          id: 'torres-del-paine',
          dayRange: 'Tag 13-15',
          location: 'Torres del Paine Nationalpark',
          stayNights: 3,
          description:
            'Base-Torres-Trek, Bootsfahrt auf dem Lago Grey und Wildlife-Spotting mit Ranger:innen.',
          transportMode: 'Busshuttle',
          travelDistanceKm: 150,
          travelDurationHours: 2.5,
          accommodation: 'EcoCamp Patagonia – nachhaltige Domes',
          highlights: ['Base Torres Sunrise', 'Guanako-Herden beobachten'],
          coordinates: [-72.9996, -50.9423]
        },
        {
          id: 'santiago-return',
          dayRange: 'Tag 16',
          location: 'Santiago Rückflug',
          stayNights: 0,
          description:
            'Letzte Souvenirs am Flughafen und optionaler Stopover in Punta Arenas für Pinguine.',
          transportMode: 'Inlandsflug Punta Arenas → Santiago',
          travelDistanceKm: 2470,
          travelDurationHours: 3.4,
          accommodation: 'Übernachtung im Flugzeug oder Airport-Hotel',
          highlights: ['Duty-Free Gourmet', 'Patagonia Gin Shop'],
          coordinates: [-70.6693, -33.4489]
        }
      ],
      essentials: {
        bestSeason: 'November – März',
        budgetPerPersonEUR: 'ab 3.400 €',
        pace: 'aktiv',
        recommendedFor: ['Outdoor-Fans', 'Fotograf:innen', 'Reisende mit Trekking-Erfahrung']
      }
    },
    {
      id: 'atacama-sternen',
      name: 'Atacama Sternen-Safari',
      tagline: 'Geysire, Salzseen und Sternwarten im Norden Chiles',
      totalDays: 12,
      totalDistanceKm: 2180,
      transportMix: ['Langstreckenflug', 'Inlandsflug', 'Mietwagen', 'Geführte Touren'],
      color: '#f97316',
      summary:
        'Der Norden lockt mit surrealen Landschaften, Sternenhimmel und indigener Kultur. Die Route kombiniert geführte Ausflüge mit eigenem Mietwagen.',
      mapPolyline: [
        [-70.6693, -33.4489],
        [-70.5505, -33.6331],
        [-68.202, -22.9087],
        [-67.7957, -23.7993],
        [-67.755, -22.335],
        [-68.9259, -22.4544],
        [-70.4861, -29.9045],
        [-70.6693, -33.4489]
      ],
      stops: [
        {
          id: 'santiago-warmup',
          dayRange: 'Tag 1-2',
          location: 'Santiago & Valle del Maipo',
          stayNights: 2,
          description:
            'Weinprobe bei Concha y Toro, Radtour durch Pirque und Vorbereitung auf die Höhenlage.',
          transportMode: 'Langstreckenflug nach Santiago',
          travelDistanceKm: 0,
          travelDurationHours: 0,
          accommodation: 'Hotel Bidasoa – nachhaltiges Stadthotel',
          highlights: ['Valle del Maipo E-Bike-Tour', 'Lastarria Food Market'],
          coordinates: [-70.5505, -33.6331]
        },
        {
          id: 'san-pedro',
          dayRange: 'Tag 3-5',
          location: 'San Pedro de Atacama',
          stayNights: 3,
          description:
            'Mondtal, Salzseen und Sternwarte San Pedro mit Milchstraßen-Fotoworkshop.',
          transportMode: 'Inlandsflug nach Calama + Shuttle',
          travelDistanceKm: 1250,
          travelDurationHours: 2.2,
          accommodation: 'Hotel Desertica – Adobe Suites mit Pool',
          highlights: ['Valle de la Luna Sunset', 'Astronomie-Session'],
          coordinates: [-68.202, -22.9087]
        },
        {
          id: 'altiplano-lagoons',
          dayRange: 'Tag 6',
          location: 'Lagunas Miscanti & Miñiques',
          stayNights: 1,
          description:
            'Blaue Lagunen auf 4.100 m Höhe mit Andenflamingos und traditionellem Almuerzo in Socaire.',
          transportMode: 'Geführte 4x4-Tour',
          travelDistanceKm: 120,
          travelDurationHours: 3.5,
          accommodation: 'Rückkehr nach San Pedro (Hotel Desertica)',
          highlights: ['Aussichtspunkt Mirador Miscanti', 'Flamingo-Sichtung'],
          coordinates: [-67.7957, -23.7993]
        },
        {
          id: 'el-tatio',
          dayRange: 'Tag 7',
          location: 'El Tatio Geysire',
          stayNights: 0,
          description:
            'Sonnenaufgang bei 80 aktiven Geysiren, anschließend Thermalbad und Rückfahrt zum Dorf.',
          transportMode: 'Minibus-Exkursion',
          travelDistanceKm: 190,
          travelDurationHours: 4.5,
          accommodation: 'Rückkehr nach San Pedro (Hotel Desertica)',
          highlights: ['Thermalbad', 'Andenfuchs beobachten'],
          coordinates: [-67.755, -22.335]
        },
        {
          id: 'calama-mine',
          dayRange: 'Tag 8-9',
          location: 'Calama & Chuquicamata',
          stayNights: 2,
          description:
            'Geführte Tour durch die größte Tagebaumine der Welt und Streetfood im Mercado Central.',
          transportMode: 'Shuttle San Pedro → Calama',
          travelDistanceKm: 100,
          travelDurationHours: 1.5,
          accommodation: 'Park Hotel Calama – Pooloase in der Wüste',
          highlights: ['Mine-Visitor-Center', 'Food Market'],
          coordinates: [-68.9259, -22.4544]
        },
        {
          id: 'la-serena',
          dayRange: 'Tag 10-11',
          location: 'La Serena & Elqui-Tal',
          stayNights: 2,
          description:
            'Pisco-Verkostung, Sternwarte Mamalluca und Solar-Küche in Vicuña.',
          transportMode: 'Inlandsflug Calama → La Serena',
          travelDistanceKm: 1040,
          travelDurationHours: 2.1,
          accommodation: 'Hotel Terral – Rooftop mit Teleskop',
          highlights: ['Sternwarte Mamalluca', 'Pisco Destillerie'],
          coordinates: [-70.4861, -29.9045]
        },
        {
          id: 'santiago-finale',
          dayRange: 'Tag 12',
          location: 'Santiago Finale',
          stayNights: 0,
          description:
            'Letzte Shopping-Runde in Lastarria und Rückflug nach Europa am Abend.',
          transportMode: 'Inlandsflug La Serena → Santiago',
          travelDistanceKm: 470,
          travelDurationHours: 1,
          accommodation: 'Airport Hotel Holiday Inn (Day Use)',
          highlights: ['Souvenirs in Lastarria', 'Vegane Küche im Barrio Italia'],
          coordinates: [-70.6693, -33.4489]
        }
      ],
      essentials: {
        bestSeason: 'April – Oktober',
        budgetPerPersonEUR: 'ab 2.650 €',
        pace: 'aktiv',
        recommendedFor: ['Astronomie-Fans', 'Reisende mit Höhenverträglichkeit', 'Foodies']
      }
    },
    {
      id: 'pazifik-genuss',
      name: 'Pazifik Genussreise',
      tagline: 'Streetart, Wein und Sternenbeobachtung mit entspanntem Tempo',
      totalDays: 10,
      totalDistanceKm: 1520,
      transportMix: ['Langstreckenflug', 'Mietwagen', 'Bahn & Bus'],
      color: '#0f766e',
      summary:
        'Ein Mix aus Küstenstädten, Weinbaugebieten und Wellbeing im Cajón del Maipo – ideal für Genießer:innen und Einsteiger:innen.',
      mapPolyline: [
        [-70.6693, -33.4489],
        [-71.6127, -33.0472],
        [-71.4062, -33.3218],
        [-71.254, -29.904],
        [-70.4789, -30.1485],
        [-70.049, -33.721],
        [-70.6693, -33.4489]
      ],
      stops: [
        {
          id: 'santiago-food',
          dayRange: 'Tag 1-2',
          location: 'Santiago Kulinarik',
          stayNights: 2,
          description:
            'Mercado Central, Empanada-Workshop und Rooftop-Bar im Barrio Lastarria.',
          transportMode: 'Langstreckenflug nach Santiago',
          travelDistanceKm: 0,
          travelDurationHours: 0,
          accommodation: 'Hotel Luciano K – Art-Déco Hotel mit Spa',
          highlights: ['Mercado Central', 'Streetart-Tour in Lastarria'],
          coordinates: [-70.6693, -33.4489]
        },
        {
          id: 'valparaiso',
          dayRange: 'Tag 3-4',
          location: 'Valparaíso & Viña del Mar',
          stayNights: 2,
          description:
            'Streetart-Spaziergänge, Ascensor-Fahrten und Strandtag in Reñaca.',
          transportMode: 'Bus oder Mietwagen',
          travelDistanceKm: 120,
          travelDurationHours: 2,
          accommodation: 'Casa Higueras – Boutiquehotel am Hang',
          highlights: ['Streetart Tour', 'Hafenrundfahrt'],
          coordinates: [-71.6127, -33.0472]
        },
        {
          id: 'casablanca',
          dayRange: 'Tag 5',
          location: 'Casablanca Valley',
          stayNights: 1,
          description:
            'Bike & Wine im Weingut Matetic, nachhaltige Küche und private Barrel-Verkostung.',
          transportMode: 'Mietwagen',
          travelDistanceKm: 45,
          travelDurationHours: 1,
          accommodation: 'La Casona Matetic – Weingut mit acht Zimmern',
          highlights: ['Wein-Blending Workshop', 'Farm-to-Table Dinner'],
          coordinates: [-71.4062, -33.3218]
        },
        {
          id: 'la-serena-coast',
          dayRange: 'Tag 6-7',
          location: 'La Serena & Küstensternwarte',
          stayNights: 2,
          description:
            'Sonnenuntergang in Coquimbo, Observatorium Collowara und Kitesurfen für Einsteiger:innen.',
          transportMode: 'Inlandsflug Santiago → La Serena',
          travelDistanceKm: 480,
          travelDurationHours: 1.1,
          accommodation: 'Hotel Costa Real – Zimmer mit Meerblick',
          highlights: ['Observatorio Collowara', 'Coquimbo Seafood Market'],
          coordinates: [-71.254, -29.904]
        },
        {
          id: 'elqui-valley',
          dayRange: 'Tag 8',
          location: 'Elqui-Tal',
          stayNights: 1,
          description:
            'Yoga in Pisco Elqui, Craft-Bier in Guayacán und Besuch kleiner Destillerien.',
          transportMode: 'Mietwagen',
          travelDistanceKm: 95,
          travelDurationHours: 1.5,
          accommodation: 'Refugio El Molle – Eco-Lodges mit Hängematten',
          highlights: ['Yoga-Session', 'Craft-Bier-Verkostung'],
          coordinates: [-70.4789, -30.1485]
        },
        {
          id: 'cajon-maipo',
          dayRange: 'Tag 9-10',
          location: 'Cajón del Maipo',
          stayNights: 2,
          description:
            'Thermalbad in den Termas Valle de Colina, Sternenhimmel und leichte Wanderungen.',
          transportMode: 'Mietwagen zurück nach Santiago',
          travelDistanceKm: 520,
          travelDurationHours: 5.5,
          accommodation: 'Lodge Altiplanico San Alfonso – Chalets im Tal',
          highlights: ['Termas Valle de Colina', 'Sternenbeobachtung'],
          coordinates: [-70.049, -33.721]
        },
        {
          id: 'departure',
          dayRange: 'Tag 10 Abend',
          location: 'Santiago Abreise',
          stayNights: 0,
          description: 'Rückgabe des Mietwagens und Rückflug nach Europa.',
          transportMode: 'Rückfahrt nach Santiago + Langstreckenflug',
          travelDistanceKm: 60,
          travelDurationHours: 1.2,
          accommodation: 'Optional Holiday Inn Airport für Day Room',
          highlights: ['Duty-Free Weinshop', 'Letzter Spaziergang im Parque Bicentenario'],
          coordinates: [-70.6693, -33.4489]
        }
      ],
      essentials: {
        bestSeason: 'September – April',
        budgetPerPersonEUR: 'ab 2.150 €',
        pace: 'entspannt',
        recommendedFor: ['Foodies', 'Paare', 'Chile-Einsteiger:innen']
      }
    }
  ]
};

// Für Einsteiger:innen: Leaflet braucht GeoJSON-Daten. Diese Hilfsfunktionen wandeln
// unsere Typescript-Strukturen in ein Format, das die Karte direkt zeichnen kann.
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
