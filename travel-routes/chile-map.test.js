import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildFeatureCollectionFromRoute, calculateBounds, fallbackData } from './chile-map.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const exampleRoute = JSON.parse(
  readFileSync(join(__dirname, 'data/routes/example-andes-pacific.json'), 'utf8')
);
const australRoute = JSON.parse(
  readFileSync(join(__dirname, 'data/routes/chile-carretera-austral.json'), 'utf8')
);
const dataset = JSON.parse(readFileSync(join(__dirname, 'travel-routes-data.json'), 'utf8'));

const transportModes = dataset.transportModes;

test('buildFeatureCollectionFromRoute yields both lines and points for slider route', () => {
  const collection = buildFeatureCollectionFromRoute(exampleRoute, transportModes);
  const lines = collection.features.filter((feature) => feature.geometry?.type === 'LineString');
  const points = collection.features.filter((feature) => feature.geometry?.type === 'Point');
  assert.ok(lines.length >= 3, 'expected at least three line segments');
  assert.ok(points.length >= 3, 'expected at least three POIs');
  lines.forEach((feature) => {
    assert.ok(feature.properties?.name, 'line feature needs a name');
    assert.equal(feature.properties?.category, 'route');
  });
});

test('buildFeatureCollectionFromRoute falls back to classic stops/segments', () => {
  const collection = buildFeatureCollectionFromRoute(australRoute, transportModes);
  const lineNames = collection.features
    .filter((feature) => feature.geometry?.type === 'LineString')
    .map((feature) => feature.properties?.name);
  assert.ok(lineNames.length >= (australRoute.segments?.length ?? 0), 'segments should be rendered as lines');
});

test('calculateBounds spans every fallback feature', () => {
  const bounds = calculateBounds(fallbackData);
  assert.ok(bounds, 'bounds should be calculated');
  const [min, max] = bounds;
  assert.ok(min[0] < max[0], 'lng span should be positive');
  assert.ok(min[1] < max[1], 'lat span should be positive');
});
