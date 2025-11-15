import type { TravelRoute } from '../types';

export const pazifikGenussRoute: TravelRoute = {
  id: 'pazifik-genuss',
  name: 'Pazifik & Genussreise',
  tagline: 'Kulinarik zwischen Santiago, Küstenorten und Sternen im Elqui-Tal',
  totalDays: 10,
  totalDistanceKm: 1325,
  transportMix: ['Langstreckenflug', 'Inlandsflug', 'Mietwagen', 'Bus'],
  color: '#16a34a',
  summary:
    'Perfekt für Genießer:innen: Santiago als Kulinarik-Hub, bunte Küstenstädte und Nächte voller Sterne im Elqui-Tal.',
  mapPolyline: [
    [-70.6693, -33.4489],
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
      location: 'Santiago Gourmet-Start',
      stayNights: 2,
      description:
        'Markthallen-Tour, Dinner im Boragó und Craft-Bier-Verkostung im Barrio Italia.',
      transportMode: 'Langstreckenflug nach Santiago',
      travelDistanceKm: 0,
      travelDurationHours: 0,
      accommodation: 'Hotel Magnolia – Rooftop-Bar mit Stadtblick',
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
};

export default pazifikGenussRoute;
