/**
 * Chile MapLibre SPA
 * -------------------
 * Diese Datei kapselt sämtliche MapLibre-Hilfsfunktionen. Wir nutzen bewusst
 * modulare Funktionen (initMap, addGeoJsonSource, addRouteLayer, addPoiLayer,
 * fitMapToData), damit Einsteiger:innen die einzelnen Schritte leicht
 * nachvollziehen und wiederverwenden können.
 */

/** @typedef {import('geojson').Feature} Feature */
/** @typedef {import('geojson').FeatureCollection} FeatureCollection */
/** @typedef {import('geojson').Geometry} Geometry */

const ROUTE_SOURCE_ID = 'chile-route-source';
const ROUTE_LAYER_ID = 'chile-routes';
const POI_LAYER_ID = 'chile-pois';
const DATASET_URL = './travel-routes-data.json';

const DEFAULT_STYLE = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap-Mitwirkende'
    }
  },
  layers: [
    {
      id: 'osm-base',
      type: 'raster',
      source: 'osm'
    }
  ]
};

const FALLBACK_TRANSPORT_MODES = {
  flight: { label: 'Flug', color: '#c084fc' },
  bus: { label: 'Fernbus', color: '#f97316' },
  drive: { label: 'Mietwagen', color: '#38bdf8' }
};

export const fallbackData = /** @type {FeatureCollection} */ ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-70.7858, -33.3929],
          [-70.6693, -33.4489],
          [-71.6127, -33.0461],
          [-70.3653, -33.6511]
        ]
      },
      properties: {
        name: 'Anden & Pazifik Explorer',
        description: 'Santiago, Valparaíso und Cajón del Maipo als Vorschau',
        category: 'route',
        color: '#38bdf8'
      }
    },
    createPointFeature([-70.6693, -33.4489], {
      name: 'Santiago de Chile',
      description: 'Metropole zwischen Anden und Pazifik',
      category: 'city',
      color: '#facc15'
    }),
    createPointFeature([-71.6127, -33.0461], {
      name: 'Valparaíso',
      description: 'Streetart, Seilbahnen und Pazifikblick',
      category: 'coast',
      color: '#facc15'
    }),
    createPointFeature([-70.3653, -33.6511], {
      name: 'Cajón del Maipo',
      description: 'Naturschutzgebiet vor den Toren Santiagos',
      category: 'mountain',
      color: '#facc15'
    })
  ]
});

/**
 * @param {[number, number]} coordinates
 * @param {{name: string; description?: string; category?: string; color?: string}} properties
 * @returns {Feature}
 */
function createPointFeature(coordinates, properties) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties
  };
}

let datasetCache = null;
let lastPopup = null;

function getMapLibre() {
  const lib = globalThis.maplibregl;
  if (!lib) {
    throw new Error('MapLibre GL JS wurde nicht geladen.');
  }
  return lib;
}

export function initMap(containerId, options = {}) {
  const maplibre = getMapLibre();
  const map = new maplibre.Map({
    container: containerId,
    style: options.style ?? DEFAULT_STYLE,
    center: options.center ?? [-70, -33],
    zoom: options.zoom ?? 4,
    attributionControl: false
  });
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibre.AttributionControl({ compact: true }));
  return map;
}

export function addGeoJsonSource(map, sourceId, data) {
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(data);
    return;
  }
  map.addSource(sourceId, {
    type: 'geojson',
    data
  });
}

export function addRouteLayer(map, sourceId, layerId = ROUTE_LAYER_ID) {
  if (map.getLayer(layerId)) return;
  map.addLayer({
    id: layerId,
    type: 'line',
    source: sourceId,
    filter: ['==', ['geometry-type'], 'LineString'],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': ['coalesce', ['get', 'color'], '#38bdf8'],
      'line-width': 4.2,
      'line-opacity': 0.9
    }
  });
}

export function addPoiLayer(map, sourceId, layerId = POI_LAYER_ID) {
  if (map.getLayer(layerId)) return;
  map.addLayer({
    id: layerId,
    type: 'circle',
    source: sourceId,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': 7,
      'circle-color': ['coalesce', ['get', 'color'], '#facc15'],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#0f172a',
      'circle-opacity': 0.95
    }
  });
}

export function calculateBounds(collection) {
  const coordinates = [];
  for (const feature of collection.features ?? []) {
    appendCoordinates(feature.geometry, coordinates);
  }
  if (!coordinates.length) return null;
  let minLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLng = coordinates[0][0];
  let maxLat = coordinates[0][1];
  coordinates.forEach(([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });
  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}

function appendCoordinates(geometry, output) {
  if (!geometry) return;
  if (geometry.type === 'Point') {
    output.push(geometry.coordinates);
  } else if (geometry.type === 'LineString') {
    geometry.coordinates.forEach((coord) => output.push(coord));
  } else if (geometry.type === 'MultiLineString' || geometry.type === 'Polygon') {
    geometry.coordinates.flat().forEach((coord) => output.push(coord));
  }
}

export function fitMapToData(map, data, padding = 48) {
  const bounds = calculateBounds(data);
  if (!bounds) return;
  const maplibre = getMapLibre();
  const lngLatBounds = new maplibre.LngLatBounds(bounds[0], bounds[1]);
  map.fitBounds(lngLatBounds, {
    padding: { top: padding, right: padding, bottom: padding, left: padding },
    duration: 0,
    maxZoom: 8.5
  });
}

function closePopup() {
  if (lastPopup) {
    lastPopup.remove();
    lastPopup = null;
  }
}

function openPopup(map, coordinates, content) {
  closePopup();
  const maplibre = getMapLibre();
  lastPopup = new maplibre.Popup({ closeButton: false, offset: 18 })
    .setLngLat(coordinates)
    .setHTML(content)
    .addTo(map);
}

export function buildFeatureCollectionFromRoute(route, transportModes = {}) {
  const features = [];
  const stopMap = new Map();
  if (Array.isArray(route.stops)) {
    route.stops.forEach((stop) => {
      stopMap.set(stop.id, stop);
      const coordinate = toLngLat(stop.coordinates);
      if (!coordinate) return;
      features.push(
        createPointFeature(coordinate, {
          name: stop.name ?? stop.city ?? stop.id,
          description: stop.description ?? stop.summary ?? stop.city,
          category: stop.type ?? 'stop',
          color: '#facc15'
        })
      );
    });
  }

  if (Array.isArray(route.mapLayers?.dailySegments) && route.mapLayers.dailySegments.length > 0) {
    route.mapLayers.dailySegments.forEach((segment, index) => {
      if (segment.geometry?.type !== 'LineString') return;
      const appearance = resolveModeAppearance(segment.mode, transportModes);
      features.push({
        type: 'Feature',
        geometry: segment.geometry,
        properties: {
          name: `Etappe ${index + 1}: ${appearance.label}`,
          description: route.days?.[index]?.station?.name ?? route.summary ?? route.title,
          category: 'route',
          color: appearance.color
        }
      });
    });
  } else if (Array.isArray(route.segments) && route.segments.length > 0) {
    route.segments.forEach((segment, index) => {
      const fromStop = stopMap.get(segment.from);
      const toStop = stopMap.get(segment.to);
      const coordinates = buildLineCoordinates(fromStop?.coordinates, toStop?.coordinates);
      if (!coordinates) return;
      const appearance = resolveModeAppearance(segment.mode, transportModes);
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates },
        properties: {
          name: `Etappe ${index + 1}: ${appearance.label}`,
          description: `${fromStop?.name ?? 'Start'} → ${toStop?.name ?? 'Ziel'}`,
          category: 'route',
          color: appearance.color
        }
      });
    });
  } else if (Array.isArray(route.days)) {
    route.days.forEach((day, index) => {
      day.arrival?.segments?.forEach((segment) => {
        const coordinates = buildLineCoordinates(segment.from?.coordinates, segment.to?.coordinates);
        if (!coordinates) return;
        const appearance = resolveModeAppearance(segment.mode, transportModes);
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: {
            name: `Etappe ${index + 1}: ${appearance.label}`,
            description: `${segment.from?.name ?? 'Anreise'} → ${segment.to?.name ?? 'Ziel'}`,
            category: 'route',
            color: appearance.color
          }
        });
      });
    });
  }

  addDayStationsAsPois(features, route);

  return { type: 'FeatureCollection', features };
}

function addDayStationsAsPois(features, route) {
  const seenIds = new Set(features.filter((feature) => feature.geometry.type === 'Point').map((feature) => feature.properties?.name));
  route.days?.forEach((day, index) => {
    const coordinate = toLngLat(day.station?.coordinates);
    if (coordinate && !seenIds.has(day.station?.name)) {
      features.push(
        createPointFeature(coordinate, {
          name: day.station?.name ?? `Tag ${index + 1}`,
          description: day.station?.description ?? 'Tagesstation',
          category: 'station',
          color: '#94a3b8'
        })
      );
      if (day.station?.name) {
        seenIds.add(day.station.name);
      }
    }
    day.arrival?.mapPoints?.forEach((poi) => {
      const poiCoord = toLngLat(poi.coordinates);
      if (!poiCoord || seenIds.has(poi.id)) return;
      features.push(
        createPointFeature(poiCoord, {
          name: poi.name ?? poi.id,
          description: poi.address ?? poi.description,
          category: poi.type ?? 'poi',
          color: '#f97316'
        })
      );
      if (poi.id) {
        seenIds.add(poi.id);
      }
    });
  });
}

function resolveModeAppearance(mode, transportModes) {
  if (!mode) {
    return { label: 'Segment', color: '#38bdf8' };
  }
  const catalog = transportModes?.[mode] ?? FALLBACK_TRANSPORT_MODES[mode];
  return {
    label: catalog?.label ?? mode,
    color: catalog?.color ?? '#38bdf8'
  };
}

function buildLineCoordinates(from, to) {
  const start = toLngLat(from);
  const end = toLngLat(to);
  if (!start || !end) return null;
  return [start, end];
}

function toLngLat(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 2 && isFinite(value[0]) && isFinite(value[1])) {
    return [value[0], value[1]];
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value;
    const lng = Number(candidate.lng ?? candidate.lon ?? candidate.longitude);
    const lat = Number(candidate.lat ?? candidate.latitude);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }
  return null;
}

async function loadDataset() {
  if (datasetCache) return datasetCache;
  const response = await fetch(DATASET_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Datensatz konnte nicht geladen werden.');
  }
  datasetCache = await response.json();
  return datasetCache;
}

function renderPoiList(container, collection) {
  const poiFeatures = (collection.features ?? []).filter((feature) => feature.geometry?.type === 'Point');
  if (!poiFeatures.length) {
    container.innerHTML = '<li>Keine POIs verfügbar.</li>';
    return;
  }
  const fragment = document.createDocumentFragment();
  poiFeatures
    .slice()
    .sort((a, b) => (a.properties?.name ?? '').localeCompare(b.properties?.name ?? ''))
    .forEach((feature) => {
      const item = document.createElement('li');
      item.className = 'poi-card';
      item.innerHTML = `
        <strong>${feature.properties?.name ?? 'POI'}</strong>
        <span>${feature.properties?.description ?? 'Beschreibung folgt.'}</span>
      `;
      fragment.appendChild(item);
    });
  container.replaceChildren(fragment);
}

function setStatus(element, message) {
  element.textContent = message;
}

async function handleRouteSelection(map, selectEl, statusEl, poiListEl) {
  const dataset = await loadDataset();
  const entries = dataset.routeIndex ?? [];
  if (!entries.length) {
    setStatus(statusEl, 'Keine Routen verfügbar.');
    return;
  }
  populateRouteOptions(selectEl, entries);
  const defaultRoute = entries[0];
  selectEl.value = defaultRoute.id;
  await updateMapWithRoute(map, defaultRoute, dataset.transportModes, statusEl, poiListEl);
  selectEl.addEventListener('change', async (event) => {
    const selectedId = event.target.value;
    const entry = entries.find((item) => item.id === selectedId);
    if (!entry) return;
    await updateMapWithRoute(map, entry, dataset.transportModes, statusEl, poiListEl);
  });
}

function populateRouteOptions(selectEl, entries) {
  selectEl.innerHTML = '';
  entries.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.name;
    option.dataset.file = entry.file;
    selectEl.appendChild(option);
  });
}

async function updateMapWithRoute(map, entry, transportModes, statusEl, poiListEl) {
  setStatus(statusEl, `Lade ${entry.name} …`);
  try {
    const response = await fetch(entry.file, { cache: 'no-store' });
    if (!response.ok) throw new Error('Route konnte nicht geladen werden.');
    const route = await response.json();
    const collection = buildFeatureCollectionFromRoute(route, transportModes);
    addGeoJsonSource(map, ROUTE_SOURCE_ID, collection);
    fitMapToData(map, collection);
    renderPoiList(poiListEl, collection);
    setStatus(statusEl, `${entry.name}: ${entry.summary}`);
  } catch (error) {
    console.error('Route konnte nicht gerendert werden', error);
    setStatus(statusEl, 'Fehler beim Laden der Route. Bitte erneut versuchen.');
  }
}

function attachMapInteractions(map) {
  map.on('click', ROUTE_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const coords = event.lngLat ?? feature.geometry.coordinates[0];
    const content = `
      <strong>${feature.properties?.name ?? 'Route'}</strong>
      <p>${feature.properties?.description ?? ''}</p>
    `;
    openPopup(map, [coords.lng ?? coords[0], coords.lat ?? coords[1]], content);
  });
  map.on('mouseenter', ROUTE_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', ROUTE_LAYER_ID, () => {
    map.getCanvas().style.cursor = '';
  });
  map.on('click', POI_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;
    const coords = feature.geometry.coordinates;
    const content = `
      <strong>${feature.properties?.name ?? 'POI'}</strong>
      <p>${feature.properties?.description ?? ''}</p>
    `;
    openPopup(map, coords, content);
  });
  map.on('mouseenter', POI_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', POI_LAYER_ID, () => {
    map.getCanvas().style.cursor = '';
  });
}

function bootstrap() {
  const mapContainerId = 'map';
  const selectEl = document.getElementById('route-select');
  const statusEl = document.getElementById('map-status');
  const poiListEl = document.getElementById('poi-list');
  if (!selectEl || !statusEl || !poiListEl) return;

  const map = initMap(mapContainerId);
  map.on('load', () => {
    addGeoJsonSource(map, ROUTE_SOURCE_ID, fallbackData);
    addRouteLayer(map, ROUTE_SOURCE_ID);
    addPoiLayer(map, ROUTE_SOURCE_ID);
    fitMapToData(map, fallbackData);
    renderPoiList(poiListEl, fallbackData);
    setStatus(statusEl, 'Vorauswahl geladen – echte Route folgt nach dem Laden.');
  });
  attachMapInteractions(map);
  void handleRouteSelection(map, selectEl, statusEl, poiListEl);
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrap);
}
