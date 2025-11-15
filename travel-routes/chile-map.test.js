import { test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateBounds, demoData, getRouteFeatures } from './chile-map.js';

function countByGeometry(type) {
  return demoData.features.filter((feature) => feature.geometry?.type === type).length;
}

test('demoData contains at least one route and multiple POIs', () => {
  const routeCount = countByGeometry('LineString');
  const poiCount = countByGeometry('Point');
  assert.ok(routeCount >= 1, 'mindestens eine Route notwendig');
  assert.ok(poiCount >= 3, 'es werden mehrere POIs erwartet');
  demoData.features.forEach((feature) => {
    assert.ok(feature.properties?.name, 'jedes Feature braucht einen Namen');
  });
});

test('getRouteFeatures exposes selectable routes with ids', () => {
  const routes = getRouteFeatures(demoData);
  assert.ok(routes.length >= 2, 'mindestens zwei auswählbare Routen');
  routes.forEach((route) => {
    assert.equal(route.geometry?.type, 'LineString');
    assert.ok(route.id, 'jede Route besitzt eine ID für feature-state');
  });
});

test('calculateBounds returns an envelope covering all demo features', () => {
  const bounds = calculateBounds(demoData);
  assert.ok(bounds, 'bounds sollten berechnet werden');
  const [min, max] = bounds;
  assert.ok(min[0] < max[0], 'lng sollte wachsen');
  assert.ok(min[1] < max[1], 'lat sollte wachsen');
  const allLngs = demoData.features.flatMap((feature) =>
    feature.geometry?.type === 'LineString'
      ? feature.geometry.coordinates.map(([lng]) => lng)
      : feature.geometry?.type === 'Point'
        ? [feature.geometry.coordinates[0]]
        : []
  );
  assert.ok(allLngs.every((lng) => lng >= min[0] && lng <= max[0]), 'alle Längengrade im Bounds');
});

test('calculateBounds returns null for empty collections', () => {
  const empty = { type: 'FeatureCollection', features: [] };
  assert.equal(calculateBounds(empty), null);
});
