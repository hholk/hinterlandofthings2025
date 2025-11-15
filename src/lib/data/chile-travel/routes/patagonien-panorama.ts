import type { TravelRoute } from '../types';

// Für Einsteiger:innen: Jede Route lebt jetzt in einer eigenen Datei. So können wir
// sie einzeln austauschen oder erweitern, ohne das komplette Datenset anfassen zu
// müssen – perfekt, wenn später Uploads oder Experimente dazukommen.
export const patagonienPanoramaRoute: TravelRoute = {
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
};

export default patagonienPanoramaRoute;
