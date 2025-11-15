// Für Einsteiger:innen: Diese Datei sammelt alle Inhalte für die Chile-Experience
// an einem Ort. Die UI liest später nur noch strukturierte Daten aus diesem Modul.
export interface MapStop {
  day: string;
  title: string;
  description: string;
  coordinates: [number, number];
}

export interface BudgetTip {
  flights: string[];
  cars: string[];
}

export interface TravelVariant {
  id: string;
  name: string;
  duration: string;
  summary: string;
  distanceKm: number;
  highlights: string[];
  itinerary: MapStop[];
  budget: BudgetTip;
  insights: string[];
}

export interface RoadTrip {
  id: string;
  title: string;
  duration: string;
  distanceKm: number;
  description: string;
  stops: string[];
}

export interface MapLegendEntry {
  label: string;
  color: string;
}

export interface ChileTravelData {
  map: {
    center: [number, number];
    zoom: number;
    legend: MapLegendEntry[];
  };
  variants: TravelVariant[];
  roadTrips: RoadTrip[];
}

// Für Einsteiger:innen: Wir exportieren ein Objekt, das die Seite direkt verwenden kann.
export const chileTravelData: ChileTravelData = {
  map: {
    center: [-70.6693, -33.4489],
    zoom: 4.3,
    legend: [
      { label: 'Übernachtungsstopp', color: '#38bdf8' },
      { label: 'Panorama-Etappe', color: '#f97316' }
    ]
  },
  variants: [
    {
      id: 'andes-seenplatte',
      name: 'Seenplatte & Patagonien',
      duration: '16 Tage',
      summary: 'Von Santiago über die Seenregion bis zu den Granitspitzen des Torres del Paine.',
      distanceKm: 3400,
      highlights: [
        'Fjord-Blick vom Flugzeug nach Puerto Natales',
        'Kajaktour zwischen den Villarrica-Lavafeldern',
        'Sonnenaufgang am Base-Torres-Viewpoint'
      ],
      itinerary: [
        {
          day: 'Tag 1-2',
          title: 'Santiago de Chile',
          description: 'Ankommen, Sky Costanera besuchen und Streetfood-Tour durch Bellavista.',
          coordinates: [-70.6693, -33.4489]
        },
        {
          day: 'Tag 3-5',
          title: 'Pucón & Villarrica',
          description: 'Thermalquellen, Vulkanwanderung und Mapuche-Küche.',
          coordinates: [-71.9545, -39.2822]
        },
        {
          day: 'Tag 6-7',
          title: 'Puerto Varas',
          description: 'Seepromenade am Llanquihue und Ausflug zur Insel Chiloé.',
          coordinates: [-72.9854, -41.3184]
        },
        {
          day: 'Tag 8-9',
          title: 'Carretera Austral Nord',
          description: 'Roadtrip nach Puyuhuapi mit Hanging Glacier und Fjordblicken.',
          coordinates: [-72.568, -44.321]
        },
        {
          day: 'Tag 10-12',
          title: 'Puerto Natales',
          description: 'Bootsreise zu den Balmaceda-Gletschern und Patagonien-Ranch.',
          coordinates: [-72.506, -51.7295]
        },
        {
          day: 'Tag 13-15',
          title: 'Torres del Paine Nationalpark',
          description: 'Base-Torres-Trek, Lago Grey und Guanako-Watching.',
          coordinates: [-72.9996, -50.9423]
        },
        {
          day: 'Tag 16',
          title: 'Santiago Rückflug',
          description: 'Abendlicher Rückflug über Punta Arenas zurück nach Santiago.',
          coordinates: [-70.6693, -33.4489]
        }
      ],
      budget: {
        flights: [
          'Iberia/LEVEL: Barcelona – Santiago ab 780 € (Carry-On + Personal Item)',
          'Sky Airline: Santiago – Puerto Natales ab 85 € inkl. 23 kg Aufgabegepäck'
        ],
        cars: [
          'Kia Soul (Europcar Puerto Montt) – 32 € / Tag, 800 km frei',
          'Suzuki Jimny 4x4 (Chilecar Puerto Natales) – 64 € / Tag, unlimitierte km'
        ]
      },
      insights: [
        'Die Carretera Austral verlangt gute Planung: Tankstellen nur alle 250 km.',
        'Torres del Paine verlangt Tagestickets online, am besten 30 Tage vorher.',
        'Für Nachtbusse zwischen Santiago und Temuco lohnt sich das Salón-Cama-Upgrade.'
      ]
    },
    {
      id: 'atacama-sternenhimmel',
      name: 'Atacama & Altiplano',
      duration: '12 Tage',
      summary: 'Nordchile mit Geysiren, Salzseen und Sternenhimmel im UNESCO-Reservat.',
      distanceKm: 2100,
      highlights: [
        'Laguna Chaxa bei Sonnenuntergang mit Flamingos',
        'Sternwarte San Pedro mit Milchstraßen-Fotoworkshop',
        'Geysirfeld El Tatio im Morgenlicht'
      ],
      itinerary: [
        {
          day: 'Tag 1-2',
          title: 'Santiago & Valle del Maipo',
          description: 'Weinprobe bei Concha y Toro und E-Bike-Tour durch Pirque.',
          coordinates: [-70.5505, -33.6331]
        },
        {
          day: 'Tag 3-5',
          title: 'San Pedro de Atacama',
          description: 'Mondtal, Salzseen und Marktbesuch in Toconao.',
          coordinates: [-68.202, -22.9087]
        },
        {
          day: 'Tag 6',
          title: 'Lagunas Miscanti & Miñiques',
          description: 'Atemberaubende Blau- und Türkistöne auf 4.100 m Höhe.',
          coordinates: [-67.7957, -23.7993]
        },
        {
          day: 'Tag 7',
          title: 'El Tatio Geysire',
          description: 'Frühmorgens 80 aktive Geysire erleben und anschließendes Thermalbad.',
          coordinates: [-67.755, -22.335]
        },
        {
          day: 'Tag 8-9',
          title: 'Calama & Chuquicamata',
          description: 'Geführte Mine-Tour und Streetfood in Calamas Mercado Central.',
          coordinates: [-68.9259, -22.4544]
        },
        {
          day: 'Tag 10-11',
          title: 'La Serena & Elqui-Tal',
          description: 'Pisco-Brennereien, Sternwarte Mamalluca und Solar-Küche.',
          coordinates: [-70.4861, -29.9045]
        },
        {
          day: 'Tag 12',
          title: 'Santiago City Finale',
          description: 'Souvenirs in Lastarria und Rooftop-Sundowner im Hotel Bidasoa.',
          coordinates: [-70.6693, -33.4489]
        }
      ],
      budget: {
        flights: [
          'LATAM Light: Madrid – Santiago ab 710 € inkl. Boardservice',
          'JetSmart Promo: Santiago – Calama ab 42 € (Handgepäck + persönliches Item)'
        ],
        cars: [
          'Chevrolet Onix (Econorent Calama) – 28 € / Tag, freie km',
          'Toyota RAV4 (Localiza La Serena) – 55 € / Tag, inkl. Vollkasko'
        ]
      },
      insights: [
        'Für Hochlagen in den Anden mindestens 3 Liter Wasser pro Tag einplanen.',
        'Geysire nur mit Daunenjacke besuchen – morgens herrschen -5 °C.',
        'Die meisten Observatorien erlauben keine weiße Stirnlampe – Rotlicht mitnehmen.'
      ]
    },
    {
      id: 'pazifik-wein',
      name: 'Pazifikküste & Wein',
      duration: '10 Tage',
      summary: 'Valparaíso, Casablanca, Elqui-Tal und ein entspannter Abschluss in den Anden.',
      distanceKm: 1500,
      highlights: [
        'Streetart-Tour auf den Cerros von Valparaíso',
        'Casablanca-Valley Wine Blending Workshop',
        'Thermalbad und Sternenhimmel im Cajón del Maipo'
      ],
      itinerary: [
        {
          day: 'Tag 1-2',
          title: 'Santiago Kulinarik',
          description: 'Mercado Central, chilenische Empanadas und Rooftop-Bar im Barrio Lastarria.',
          coordinates: [-70.6693, -33.4489]
        },
        {
          day: 'Tag 3-4',
          title: 'Valparaíso & Viña del Mar',
          description: 'Ascensor Artillería, Hafenrundfahrt und Beach-Tag in Reñaca.',
          coordinates: [-71.6127, -33.0472]
        },
        {
          day: 'Tag 5',
          title: 'Casablanca Valley',
          description: 'Bike & Wine im Weingut Matetic und nachhaltige Küche im Restaurant Equilibrio.',
          coordinates: [-71.4062, -33.3218]
        },
        {
          day: 'Tag 6-7',
          title: 'La Serena & Küstensternwarte',
          description: 'Sonnenuntergang in Coquimbo und Sternführung in Collowara.',
          coordinates: [-71.254, -29.904]
        },
        {
          day: 'Tag 8',
          title: 'Elqui-Tal',
          description: 'Yoga in Pisco Elqui und Craft-Bier in der Guayacán-Brauerei.',
          coordinates: [-70.4789, -30.1485]
        },
        {
          day: 'Tag 9-10',
          title: 'Cajón del Maipo',
          description: 'Heißquellen im Termas Valle de Colina und Wanderung zur Morado-Gletscherzunge.',
          coordinates: [-70.049, -33.721]
        }
      ],
      budget: {
        flights: [
          'Air Europa Basic: Madrid – Santiago ab 690 € mit 10 kg Handgepäck',
          'Sky Airline Promo: Santiago – La Serena ab 39 € (Frühbucher)'
        ],
        cars: [
          'Hyundai Accent (Localiza Santiago) – 24 € / Tag, 400 km frei',
          'MG ZS Compact SUV (United Rent a Car) – 37 € / Tag, unlimitierte km'
        ]
      },
      insights: [
        'In Valparaíso lohnt sich das Bip!-Ticket der Metro – spart Wartezeit und Bargeld.',
        'Für Wein-Workshops rechtzeitig reservieren: Plätze sind auf 12 Teilnehmende begrenzt.',
        'Straßen ins Cajón del Maipo können nach Regen gesperrt sein – lokale Wetter-Apps prüfen.'
      ]
    }
  ],
  roadTrips: [
    {
      id: 'valparaiso-weekender',
      title: 'Valparaíso Weekender',
      duration: '2 Tage',
      distanceKm: 240,
      description: 'Schnelle Küstenflucht mit Streetart, Pazifik-Sonnenuntergang und frischem Ceviche.',
      stops: ['Santiago', 'Casablanca Valley', 'Valparaíso', 'Concón']
    },
    {
      id: 'colchagua-classic',
      title: 'Colchagua & Maule Weinroute',
      duration: '3 Tage',
      distanceKm: 520,
      description: 'Boutique-Wineries, Fahrradtouren durch Rebstöcke und lokale Estancias.',
      stops: ['Santiago', 'Santa Cruz', 'Vichuquén-See', 'Talca']
    },
    {
      id: 'cajon-del-maipo-escape',
      title: 'Cajón del Maipo Escape',
      duration: '1-2 Tage',
      distanceKm: 180,
      description: 'Kurzer Andenabstecher mit Thermalquellen, Rafting und Craft-Kaffee.',
      stops: ['Santiago', 'San José de Maipo', 'Termas Valle de Colina']
    }
  ]
};

// Hilfsfunktion: Die Karte erwartet GeoJSON-Daten – wir erzeugen sie on-the-fly.
export function buildVariantGeoJSON(variant: TravelVariant) {
  return {
    type: 'FeatureCollection',
    features: variant.itinerary.map((stop, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: stop.coordinates
      },
      properties: {
        order: index,
        title: stop.title,
        description: stop.description,
        day: stop.day
      }
    }))
  } as const;
}

// Linienzug für MapLibre – verbindet die Stopps in chronologischer Reihenfolge.
export function buildVariantLineString(variant: TravelVariant) {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: variant.itinerary.map((stop) => stop.coordinates)
        },
        properties: {}
      }
    ]
  } as const;
}
