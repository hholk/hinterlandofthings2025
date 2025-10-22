import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonPath = join(__dirname, 'travel-routes-data.json');
const cssPath = join(__dirname, 'travel-routes.css');
const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
const cssSource = readFileSync(cssPath, 'utf8');
const routes = (data.routeIndex ?? []).map((entry) => {
  const routePath = join(__dirname, entry.file);
  return JSON.parse(readFileSync(routePath, 'utf8'));
});

const allowedModes = new Set(Object.keys(data.transportModes));

test('meta information is present', () => {
  assert.ok(data.meta?.title, 'meta title missing');
  assert.ok(Array.isArray(data.routeIndex) && data.routeIndex.length === 7, 'expected 7 routes');
});

// Wir prüfen das Stylesheet direkt, damit der Grid-Anteil für Einsteiger:innen
// nachvollziehbar dokumentiert bleibt und künftige Änderungen nicht versehentlich
// die 2/3–1/3-Verteilung zerstören.
test('desktop layout keeps detail view within the first screen', () => {
  const match = cssSource.match(/\.travel-app\s*\{[\s\S]*?grid-template-rows:\s*minmax\(360px,\s*2fr\)\s*minmax\(320px,\s*1fr\);/);
  assert.ok(
    match,
    'grid-template-rows should reserve roughly one third of the height for the detail section'
  );
});

test('route index entries expose search tokens', () => {
  data.routeIndex.forEach((entry) => {
    assert.ok(Array.isArray(entry.searchTokens), 'search tokens missing');
    assert.ok(entry.searchTokens.length > 0, 'search tokens should not be empty');
  });
});

test('transport modes contain rich metadata', () => {
  Object.values(data.transportModes).forEach((mode) => {
    assert.ok(mode.description, 'mode description missing');
    assert.equal(typeof mode.averageSpeedKmh, 'number');
    assert.equal(typeof mode.carbonPerKm, 'number');
  });
});

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

test('custom template can be instantiated', () => {
  const template = data.templates?.blankRoute;
  assert.ok(template, 'blank route template missing');
  assert.equal(template.stops.length, 0);
  assert.equal(template.segments.length, 0);
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

// simple smoke test für die Browser-Utility-Funktionen
test('markdown helper renders headings', async () => {
  const module = await import('./travel-routes.js');
  const html = module.markdownToHtml('# Titel');
  assert.ok(html.includes('<h1>Titel</h1>'));
});

test('custom route loader returns array even without localStorage', async () => {
  const module = await import('./travel-routes.js');
  const routes = module.loadCustomRoutes();
  assert.ok(Array.isArray(routes));
});

test('copyActivityToRoute clones activities without duplicates', async () => {
  const module = await import('./travel-routes.js');
  const { state, copyActivityToRoute } = module;

  const originalCustomRoutes = state.customRoutes;
  const originalRouteDetails = state.routeDetails;

  state.customRoutes = [
    {
      id: 'custom-test',
      name: 'Eigene Test-Route',
      source: 'custom',
      activities: [],
    },
  ];
  state.routeDetails = new Map([
    [
      'curated-test',
      {
        activities: [
          {
            title: 'Kajak auf dem Fjord',
            stopId: 'stop-1',
            durationHours: 3,
            price: 89,
          },
        ],
      },
    ],
  ]);

  try {
    const successFirst = await copyActivityToRoute('curated-test', 0, 'custom-test');
    assert.equal(successFirst, true);
    assert.equal(state.customRoutes[0].activities.length, 1);
    assert.equal(state.customRoutes[0].activities[0].title, 'Kajak auf dem Fjord');
    assert.equal(state.customRoutes[0].activities[0].stopId, 'stop-1');

    const successSecond = await copyActivityToRoute('curated-test', 0, 'custom-test');
    assert.equal(successSecond, false);
    assert.equal(state.customRoutes[0].activities.length, 1);
  } finally {
    state.customRoutes = originalCustomRoutes;
    state.routeDetails = originalRouteDetails;
  }
});

test('scrollDetailToStop focuses list entries and falls back gracefully', async () => {
  const module = await import('./travel-routes.js');
  const { dom, scrollDetailToStop } = module;

  const classValues = new Set();
  let added = false;
  let removed = false;
  let scrollArgs = null;
  let containerScrolls = 0;
  let returnTarget = true;

  const classList = {
    add(name) {
      classValues.add(name);
      if (name === 'travel-stop-item--focus') {
        added = true;
      }
    },
    remove(name) {
      classValues.delete(name);
      if (name === 'travel-stop-item--focus') {
        removed = true;
      }
    },
    contains(name) {
      return classValues.has(name);
    },
  };

  const target = {
    classList,
    scrollIntoView: (options) => {
      scrollArgs = options;
    },
  };

  const originalDetail = dom.detail;

  dom.detail = {
    querySelector: () => (returnTarget ? target : null),
    scrollIntoView: (options) => {
      scrollArgs = options;
      containerScrolls += 1;
    },
  };

  const originalTimeout = globalThis.setTimeout;
  try {
    globalThis.setTimeout = (fn) => {
      fn();
      return 0;
    };

    const found = scrollDetailToStop('stop-42');
    assert.equal(found, true);
    assert.deepEqual(scrollArgs, { behavior: 'smooth', block: 'center' });
    assert.equal(containerScrolls, 0);
    assert.equal(added, true);
    assert.equal(removed, true);

    scrollArgs = null;
    returnTarget = false;
    containerScrolls = 0;
    const fallback = scrollDetailToStop('missing');
    assert.equal(fallback, false);
    assert.deepEqual(scrollArgs, { behavior: 'smooth', block: 'start' });
    assert.equal(containerScrolls, 1);
  } finally {
    globalThis.setTimeout = originalTimeout;
    dom.detail = originalDetail;
  }
});
