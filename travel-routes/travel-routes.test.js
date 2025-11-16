import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, 'travel-routes-data.json');
const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
const rawRoutes = (data.routeIndex ?? []).map((entry) => {
  const routePath = join(__dirname, entry.file);
  return JSON.parse(readFileSync(routePath, 'utf8'));
});

const routes = rawRoutes.filter((route) => Array.isArray(route.stops));
const exampleRoute = rawRoutes.find((route) => route.id === 'example-andes-pacific');
const allowedModes = new Set(Object.keys(data.transportModes));

// Für Einsteiger:innen: Auch ohne interaktive Karte bleiben die GeoJSON-Daten erhalten,
// damit neue Visualisierungen jederzeit möglich sind. Die folgenden Tests stellen sicher,
// dass der Datensatz weiterhin vollständig gepflegt ist.

test('meta information is present', () => {
  assert.ok(data.meta?.title, 'meta title missing');
  assert.ok(Array.isArray(data.routeIndex) && data.routeIndex.length >= 13, 'expected at least 13 routes');
});

const januaryRouteIds = [
  'chile-lakes-loop',
  'chile-panamericana-roadtrip',
  'chile-instagram-highlights',
  'chile-carretera-austral',
  'chile-wine-gastronomy',
  'chile-culture-altiplano',
  'chile-route-1-atacama-salare-2026',
  'chile-route-2-pazifik-wein-2026',
  'chile-route-3-lakes-volcanoes-2026',
  'chile-route-4-patagonia-sur-2026',
  'chile-route-5-carretera-austral-light-2026',
  'chile-route-6-big-mix-2026'
];

const routesById = new Map(rawRoutes.map((route) => [route.id, route]));

test('january expeditions stay true to the 4.–20. januar timeline', () => {
  januaryRouteIds.forEach((id) => {
    const indexEntry = data.routeIndex.find((entry) => entry.id === id);
    assert.ok(indexEntry, `route index entry missing for ${id}`);
    assert.ok(/Januar/.test(indexEntry.summary), 'summary should mention January window');

    const route = routesById.get(id);
    assert.ok(route, `route json missing for ${id}`);
    assert.equal(route.meta?.durationDays, 17, 'expected 17-day itineraries');
    assert.ok(route.summary.includes('4.'), 'summary should reference the 4. Januar start');
  });
});

test('suggestion library exposes mindestens ein Dutzend Mix-and-Match-Ideen', () => {
  assert.ok(Array.isArray(data.suggestionLibrary), 'suggestion library missing');
  assert.ok(data.suggestionLibrary.length >= 12, 'expected at least 12 suggestion entries');
  const flights = data.suggestionLibrary.filter((entry) => entry.type === 'flight');
  const roadtrips = data.suggestionLibrary.filter((entry) => entry.type === 'roadtrip');
  assert.ok(flights.length >= 3, 'expected at least 3 flight-based ideas');
  assert.ok(roadtrips.length >= 3, 'expected at least 3 roadtrip ideas');
});

test('route index highlights mindestens drei Flug- und Roadtrip-Optionen', () => {
  const flights = data.routeIndex.filter((entry) => entry.tags?.includes('flight'));
  const roadtrips = data.routeIndex.filter((entry) => entry.tags?.includes('roadtrip'));
  assert.ok(flights.length >= 3, 'expected at least 3 flight-based routes');
  assert.ok(roadtrips.length >= 3, 'expected at least 3 roadtrip routes');
});

// Die folgenden Tests prüfen die einzelnen JSON-Routen auf Vollständigkeit.

test('every route has valid stops and segments', () => {
  routes.forEach((route) => {
    assert.ok(route.id, 'route id missing');
    const stopIds = new Set();
    route.stops.forEach((stop) => {
      assert.ok(stop.id, 'stop needs id');
      stopIds.add(stop.id);
      assert.ok(stop.coordinates, `stop ${stop.id} missing coordinates`);
      assert.equal(typeof stop.coordinates.lat, 'number');
      assert.equal(typeof stop.coordinates.lng, 'number');
      assert.ok(stop.description, 'stop description missing');
      assert.ok(stop.timezone, 'stop timezone missing');
      assert.ok(Array.isArray(stop.photos) && stop.photos.length > 0, 'stop photos missing');
      assert.equal(typeof stop.rating, 'number');
    });
    (route.segments ?? []).forEach((segment) => {
      assert.ok(stopIds.has(segment.from), `segment from invalid (${segment.from})`);
      assert.ok(stopIds.has(segment.to), `segment to invalid (${segment.to})`);
      assert.ok(allowedModes.has(segment.mode), `segment mode ${segment.mode} not allowed`);
      assert.ok(segment.id, 'segment id missing');
      assert.ok(segment.operator, 'segment operator missing');
      if (segment.distanceKm && data.transportModes[segment.mode]?.carbonPerKm) {
        assert.equal(typeof segment.carbonKg, 'number');
      }
    });
  });
});

test('every stop exposes spoiler notes for the station view', () => {
  routes.forEach((route) => {
    route.stops.forEach((stop) => {
      assert.ok(Array.isArray(stop.notes), `stop ${stop.id} notes missing`);
      assert.ok(stop.notes.length > 0, `stop ${stop.id} notes should not be empty`);
      stop.notes.forEach((note, index) => {
        assert.equal(typeof note, 'string', `note ${index} in ${stop.id} must be string`);
        assert.ok(note.trim().length >= 10, `note ${index} in ${stop.id} too short`);
      });
    });
  });
});

test('routes expose metrics for planning', () => {
  routes.forEach((route) => {
    assert.ok(route.metrics, 'metrics missing');
    assert.equal(typeof route.metrics.totalDistanceKm, 'number');
    assert.equal(typeof route.metrics.estimatedCarbonKg, 'number');
    assert.equal(typeof route.metrics.segmentCount, 'number');
    assert.equal(typeof route.metrics.foodCount, 'number');
    assert.equal(typeof route.metrics.activityCount, 'number');
    assert.equal(typeof route.metrics.lodgingCount, 'number');
    if ('groundTransportCarbonKg' in route.metrics) {
      assert.equal(typeof route.metrics.groundTransportCarbonKg, 'number');
    }
  });
});

test('flights reference existing stops and contain pricing', () => {
  routes.forEach((route) => {
    const stopIds = new Set(route.stops.map((stop) => stop.id));
    (route.flights ?? []).forEach((flight) => {
      assert.ok(stopIds.has(flight.fromStopId), 'flight from must reference stop');
      assert.ok(stopIds.has(flight.toStopId), 'flight to must reference stop');
      assert.ok(typeof flight.price === 'number', 'flight needs numeric price');
      assert.ok(flight.aircraft, 'flight aircraft missing');
      assert.ok(flight.cabinClass, 'flight cabin class missing');
      assert.ok(flight.baggage, 'flight baggage missing');
      assert.equal(typeof flight.carbonKg, 'number');
    });
  });
});

test('lodging and food entries contain enrichments', () => {
  routes.forEach((route) => {
    (route.lodging ?? []).forEach((stay) => {
      assert.equal(typeof stay.nights, 'number');
      assert.ok(Array.isArray(stay.amenities), 'lodging amenities missing');
    });
    (route.food ?? []).forEach((item) => {
      assert.ok(item.mustTry?.length, 'food mustTry missing');
      assert.ok(item.images?.length, 'food images missing');
    });
    (route.activities ?? []).forEach((activity) => {
      assert.ok(activity.website, 'activity website missing');
      assert.ok(activity.difficulty, 'activity difficulty missing');
    });
  });
});

test('example slider route bietet tagesbasierte Segmente mit Kartenkontext', () => {
  assert.ok(exampleRoute, 'example route missing');
  assert.ok(Array.isArray(exampleRoute.days), 'example days missing');
  assert.equal(exampleRoute.days.length, 3, 'example should cover exactly 3 days');
  assert.ok(Array.isArray(exampleRoute.mapLayers?.dailySegments), 'daily segments missing');
  assert.equal(
    exampleRoute.mapLayers.dailySegments.length,
    exampleRoute.days.length,
    'each day should expose one geometry segment'
  );

  exampleRoute.days.forEach((day) => {
    assert.ok(day.date, 'day needs date');
    assert.ok(day.station?.name, 'station name missing');
    assert.ok(Array.isArray(day.station.images) && day.station.images.length >= 2, 'station needs multiple images');

    assert.ok(Array.isArray(day.arrival?.segments) && day.arrival.segments.length > 0, 'arrival segments missing');
    day.arrival.segments.forEach((segment) => {
      assert.ok(segment.mode, 'segment mode missing');
      assert.ok(Array.isArray(segment.images) && segment.images.length >= 2, 'segments need multiple images');
    });

    assert.ok(Array.isArray(day.arrival?.mapPoints) && day.arrival.mapPoints.length > 0, 'arrival map points missing');
    day.arrival.mapPoints.forEach((point) => {
      assert.ok(point.id, 'map point id missing');
      assert.ok(point.coordinates?.lat, 'map point lat missing');
      assert.ok(point.coordinates?.lng, 'map point lng missing');
      assert.ok(Array.isArray(point.images) && point.images.length >= 2, 'map point images missing');
    });

    assert.ok(Array.isArray(day.activities) && day.activities.length > 0, 'activities missing');
    day.activities.forEach((activity) => {
      assert.ok(activity.name, 'activity name missing');
      assert.ok(Array.isArray(activity.images) && activity.images.length >= 2, 'activity images missing');
      assert.ok(Array.isArray(activity.restaurants), 'activity restaurants missing');
      activity.restaurants.forEach((restaurant) => {
        assert.ok(Array.isArray(restaurant.images) && restaurant.images.length >= 2, 'restaurant images missing');
      });
    });

    assert.ok(Array.isArray(day.hotels) && day.hotels.length >= 5, 'need at least five hotel suggestions');
    day.hotels.forEach((hotel) => {
      assert.ok(Array.isArray(hotel.images) && hotel.images.length >= 2, 'hotel images missing');
      assert.ok(hotel.url, 'hotel url missing');
    });

    assert.ok(day.mobilityOptions?.nextFlight, 'next flight missing');
    assert.ok(day.mobilityOptions?.nextBus, 'next bus missing');
    assert.ok(day.mobilityOptions?.nextDrive, 'next drive missing');
    ['nextFlight', 'nextBus', 'nextDrive'].forEach((key) => {
      const option = day.mobilityOptions[key];
      assert.ok(Array.isArray(option.images) && option.images.length >= 2, `${key} images missing`);
    });
  });
});

test('poi overview is available as separate file', () => {
  assert.ok(data.poiOverview?.file, 'poi overview file missing');
  const poiPath = join(__dirname, data.poiOverview.file);
  const poiData = JSON.parse(readFileSync(poiPath, 'utf8'));
  assert.ok(Array.isArray(poiData.items), 'poi items missing');
  assert.ok(poiData.items.length > 0, 'poi list empty');
  poiData.items.forEach((item) => {
    assert.ok(item.id, 'poi id missing');
    assert.ok(item.description, 'poi description missing');
  });
});
