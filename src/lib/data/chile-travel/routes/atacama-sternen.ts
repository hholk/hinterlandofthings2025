import type { TravelRoute } from '../types';

export const atacamaSternenSafariRoute: TravelRoute = {
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
    recommendedFor: ['Astro-Fans', 'Fotografie-Begeisterte', 'Chile-Kenner:innen']
  }
};

export default atacamaSternenSafariRoute;
