import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSegmentFeatures,
  buildPoiFeatures,
  calculateBounds,
  normalizeCoordinate,
  resolveTileTemplates,
  createMapStyle
} from './chile-map.js';

const transportModes = {
  drive: { label: 'Mietwagen', color: '#5bd1ff' },
  flight: { label: 'Flug', color: '#c792ea', dashArray: '4 6' }
};

test('normalizeCoordinate handles arrays and objects', () => {
  assert.deepEqual(normalizeCoordinate([-70, -30]), [-70, -30]);
  assert.deepEqual(normalizeCoordinate({ lng: -71, lat: -31 }), [-71, -31]);
  assert.equal(normalizeCoordinate([null, 2]), null);
});

test('buildSegmentFeatures prefers daily geometries', () => {
  const route = {
    mapLayers: {
      dailySegments: [
        {
          dayId: 'd1',
          mode: 'flight',
          geometry: {
            type: 'LineString',
            coordinates: [
              [-70.1, -33.4],
              [-68.9, -22.5]
            ]
          }
        }
      ]
    },
    segments: [
      {
        id: 'fallback',
        mode: 'drive',
        from: 'a',
        to: 'b'
      }
    ],
    stops: [
      { id: 'a', coordinates: { lng: -70, lat: -33 } },
      { id: 'b', coordinates: { lng: -71, lat: -34 } }
    ]
  };
  const features = buildSegmentFeatures(route, transportModes);
  assert.equal(features.length, 1);
  assert.equal(features[0].properties.mode, 'flight');
  assert.equal(features[0].geometry.coordinates.length, 2);
});

test('buildSegmentFeatures falls back to stops and arrival segments', () => {
  const route = {
    stops: [
      { id: 's1', coordinates: { lng: -70, lat: -33 }, name: 'Start' },
      { id: 's2', coordinates: { lng: -71, lat: -34 }, name: 'Ende' }
    ],
    segments: [
      { id: 'seg-1', mode: 'drive', from: 's1', to: 's2', distanceKm: 120 }
    ],
    days: [
      {
        id: 'day-1',
        arrival: {
          segments: [
            {
              mode: 'flight',
              from: { coordinates: { lng: -70.5, lat: -33.5 } },
              to: { coordinates: { lng: -68.5, lat: -22.5 } }
            }
          ]
        }
      }
    ]
  };
  const features = buildSegmentFeatures(route, transportModes);
  assert.equal(features.length, 1);
  assert.equal(features[0].properties.mode, 'drive');
});

test('buildSegmentFeatures annotates fallback segments with stop metadata', () => {
  const route = {
    stops: [
      { id: 'a', coordinates: { lng: -71.6, lat: -33 }, name: 'Santiago' },
      { id: 'b', coordinates: { lng: -70.8, lat: -33.4 }, name: 'Valparaíso' }
    ],
    segments: [
      { id: 'seg-a', mode: 'drive', from: 'a', to: 'b', distanceKm: 120, durationHours: 2.5 }
    ]
  };
  const features = buildSegmentFeatures(route, transportModes);
  assert.equal(features.length, 1);
  assert.equal(features[0].properties.from, 'Santiago');
  assert.equal(features[0].properties.to, 'Valparaíso');
  assert.equal(features[0].properties.distanceKm, 120);
});

test('buildPoiFeatures uses stops or day map points', () => {
  const stopRoute = {
    stops: [
      {
        id: 's1',
        name: 'Valparaíso',
        city: 'Valparaíso',
        coordinates: { lng: -71.6, lat: -33 },
        description: 'Hafenstadt'
      }
    ]
  };
  const stopFeatures = buildPoiFeatures(stopRoute);
  assert.equal(stopFeatures.length, 1);
  assert.equal(stopFeatures[0].properties.name, 'Valparaíso');

  const dayRoute = {
    days: [
      {
        id: 'd1',
        station: {
          name: 'Santiago',
          coordinates: { lng: -70.6, lat: -33.4 }
        },
        arrival: {
          mapPoints: [
            {
              id: 'poi-1',
              name: 'Cerro San Cristóbal',
              coordinates: { lng: -70.63, lat: -33.41 }
            }
          ]
        }
      }
    ]
  };
  const dayFeatures = buildPoiFeatures(dayRoute);
  assert.equal(dayFeatures.length, 2);
});

test('calculateBounds covers all supplied geometries', () => {
  const collection = {
    type: 'FeatureCollection',
    features: [
      { geometry: { type: 'Point', coordinates: [-71, -33] } },
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [-72, -34],
            [-70, -30]
          ]
        }
      }
    ]
  };
  const bounds = calculateBounds(collection);
  assert.ok(bounds);
  assert.deepEqual(bounds[0], [-72, -34]);
  assert.deepEqual(bounds[1], [-70, -30]);
});

test('resolveTileTemplates handles arrays, subdomains and fallbacks', () => {
  const arrayTiles = resolveTileTemplates({ tileLayer: ['https://a.tile/{z}/{x}/{y}.png'] });
  assert.deepEqual(arrayTiles, ['https://a.tile/{z}/{x}/{y}.png']);

  const subdomains = resolveTileTemplates({ tileLayer: 'https://{s}.tile/{z}/{x}/{y}.png', tileSubdomains: ['x', 'y'] });
  assert.deepEqual(subdomains, ['https://x.tile/{z}/{x}/{y}.png', 'https://y.tile/{z}/{x}/{y}.png']);

  const fallback = resolveTileTemplates(null);
  assert.deepEqual(fallback, ['https://tile.openstreetmap.org/{z}/{x}/{y}.png']);
});

test('createMapStyle always returns the raster style used by the UI theme', () => {
  const style = createMapStyle({ tileLayer: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', styleUrl: 'https://legacy/style.json' });
  assert.equal(style.layers?.[0]?.id, 'osm-base');
  assert.equal(style.sources?.osm?.type, 'raster');
  assert.ok(Array.isArray(style.sources?.osm?.tiles));
});
