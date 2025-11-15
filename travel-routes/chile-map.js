/**
 * Chile Travel Experience – MapLibre Demo
 * ---------------------------------------
 * Diese Version konzentriert sich auf eine leicht verständliche Grundstruktur.
 * Alle GeoJSON-Daten liegen lokal vor, damit die Karte ohne Backend lauffähig ist.
 */

/** @typedef {import('geojson').Feature} Feature */
/** @typedef {import('geojson').FeatureCollection} FeatureCollection */
/** @typedef {import('geojson').Geometry} Geometry */

const SOURCE_ID = 'chile-travel-geojson';
const ROUTE_LAYER_ID = 'chile-routes';
const POI_LAYER_ID = 'chile-pois';
const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';
const ROUTE_HIGHLIGHT_COLOR = '#f97316';
const ROUTE_DEFAULT_WIDTH = 4;
const ROUTE_SELECTED_WIDTH = 6;

let activePopup = null;

// Demo-Daten: eine Route (LineString) plus mehrere Points of Interest
export const demoData = /** @type {FeatureCollection} */ ({
  type: 'FeatureCollection',
  features: [
    createRoute('andes-atacama',
      [
        [-70.6693, -33.4489],
        [-71.6127, -33.0461],
        [-70.4025, -23.6509],
        [-68.2039, -22.9092],
        [-68.2005, -22.9111],
        [-67.8121, -22.3252]
      ],
      {
        name: 'Anden & Atacama Explorer',
        description: 'Von der Hauptstadt bis in die trockenste Wüste der Welt.',
        color: '#38bdf8',
        distance: '1.400 km'
      }
    ),
    createRoute('lakes-pacific',
      [
        [-70.6693, -33.4489],
        [-72.5904, -38.7359],
        [-72.9854, -41.3171],
        [-73.764, -42.4823],
        [-73.2187, -39.8196]
      ],
      {
        name: 'Seen & Pazifik Linie',
        description: 'Von Santiago durch das Seengebiet bis auf die Insel Chiloé.',
        color: '#0ea5e9',
        distance: '1.200 km'
      }
    ),
    createPoi([-70.6693, -33.4489], {
      name: 'Santiago de Chile',
      description: 'Startpunkt der Reise zwischen Anden und Pazifik.',
      category: 'city'
    }),
    createPoi([-71.6127, -33.0461], {
      name: 'Valparaíso',
      description: 'Street-Art-Hotspot mit historischem Hafen.',
      category: 'coast'
    }),
    createPoi([-68.2039, -22.9092], {
      name: 'Calama',
      description: 'Tor zur Atacama-Wüste und wichtiger Flughafen.',
      category: 'hub'
    }),
    createPoi([-68.2005, -22.9111], {
      name: 'San Pedro de Atacama',
      description: 'Basecamp für Hochland-Lagunen und Sternenhimmel.',
      category: 'desert'
    }),
    createPoi([-67.8121, -22.3252], {
      name: 'Valle de la Luna',
      description: 'Mondlandschaften im Herzen der Atacama.',
      category: 'highlight'
    }),
    createPoi([-72.5904, -38.7359], {
      name: 'Temuco',
      description: 'Tor zur Mapuche-Kultur und zum chilenischen Seengebiet.',
      category: 'culture'
    }),
    createPoi([-72.9854, -41.3171], {
      name: 'Puerto Varas',
      description: 'Vulkanblick am Lago Llanquihue.',
      category: 'lake'
    }),
    createPoi([-73.764, -42.4823], {
      name: 'Castro (Chiloé)',
      description: 'Palafitos und Holzkathedralen im Südpazifik.',
      category: 'coast'
    })
  ]
});

/**
 * Hilfsfunktion zum Erstellen einer Routen-Geometrie mit ID.
 * @param {string} id
 * @param {Array<[number, number]>} coordinates
 * @param {{name: string; description?: string; distance?: string; color?: string}} properties
 */
function createRoute(id, coordinates, properties) {
  return {
    id,
    type: 'Feature',
    geometry: { type: 'LineString', coordinates },
    properties: { category: 'route', ...properties }
  };
}

/**
 * Erstellt ein Point-Feature mit Grund-Properties.
 * @param {[number, number]} coordinates
 * @param {{name: string; description?: string; category?: string; color?: string}} properties
 * @returns {Feature}
 */
function createPoi(coordinates, properties) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates },
    properties: { color: '#facc15', ...properties }
  };
}

/**
 * Liefert nur die LineString-Features der Collection zurück.
 * @param {FeatureCollection} collection
 */
export function getRouteFeatures(collection) {
  return (collection.features ?? []).filter((feature) => feature.geometry?.type === 'LineString');
}

function getMapLibre() {
  const lib = globalThis.maplibregl;
  if (!lib) {
    throw new Error('MapLibre GL JS wurde nicht gefunden.');
  }
  return lib;
}

/**
 * Initialisiert eine MapLibre-Karte auf dem gewünschten Container.
 * @param {string} containerId
 * @param {{center?: [number, number]; zoom?: number; style?: string | object}} options
 */
export function initMap(containerId, options = {}) {
  const maplibre = getMapLibre();
  return new maplibre.Map({
    container: containerId,
    style: options.style ?? DEFAULT_STYLE,
    center: options.center ?? [-70.5, -28],
    zoom: options.zoom ?? 4,
    attributionControl: false
  });
}

/**
 * Fügt die kombinierte GeoJSON-Quelle hinzu oder aktualisiert sie.
 * @param {import('maplibre-gl').Map} map
 * @param {string} sourceId
 * @param {FeatureCollection} data
 * @param {{promoteId?: string}} [options]
 */
export function addGeoJsonSource(map, sourceId, data, options = {}) {
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(data);
    return;
  }
  map.addSource(sourceId, { type: 'geojson', data, ...options });
}

/**
 * Zeichnet Linien für alle LineString-Features.
 * @param {import('maplibre-gl').Map} map
 * @param {string} sourceId
 * @param {string} [layerId]
 */
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
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ROUTE_HIGHLIGHT_COLOR,
        ['coalesce', ['get', 'color'], '#38bdf8']
      ],
      'line-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        ROUTE_SELECTED_WIDTH,
        ROUTE_DEFAULT_WIDTH
      ],
      'line-opacity': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        1,
        0.6
      ]
    }
  });
}

/**
 * Zeigt Points of Interest als Kreise.
 * @param {import('maplibre-gl').Map} map
 * @param {string} sourceId
 * @param {string} [layerId]
 */
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
      'circle-stroke-color': '#0f172a'
    }
  });
}

/**
 * Berechnet die Bounding Box aller Features.
 * @param {FeatureCollection} collection
 * @returns {[[number, number], [number, number]] | null}
 */
export function calculateBounds(collection) {
  const coords = [];
  for (const feature of collection.features ?? []) {
    collectCoordinates(feature.geometry, coords);
  }
  if (!coords.length) return null;
  let [minLng, minLat] = coords[0];
  let [maxLng, maxLat] = coords[0];
  for (const [lng, lat] of coords) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}

/**
 * Rekursiv alle Koordinaten einsammeln (unterstützt auch Multi-Varianten).
 * @param {Geometry | null} geometry
 * @param {number[][]} output
 */
function collectCoordinates(geometry, output) {
  if (!geometry) return;
  if (geometry.type === 'Point') {
    output.push(geometry.coordinates);
    return;
  }
  if (geometry.type === 'LineString') {
    geometry.coordinates.forEach((coord) => output.push(coord));
    return;
  }
  const nestedCoords = Array.isArray(geometry.coordinates) ? geometry.coordinates.flat(2) : [];
  nestedCoords.forEach((coord) => {
    if (Array.isArray(coord) && coord.length === 2) {
      output.push(coord);
    }
  });
}

/**
 * Passt die Karte so an, dass alle Features sichtbar sind.
 * @param {import('maplibre-gl').Map} map
 * @param {FeatureCollection} data
 * @param {number} [padding]
 */
export function fitMapToData(map, data, padding = 48) {
  const bounds = calculateBounds(data);
  if (!bounds) return;
  const maplibre = getMapLibre();
  const lngLatBounds = new maplibre.LngLatBounds(bounds[0], bounds[1]);
  map.fitBounds(lngLatBounds, {
    padding,
    duration: 0,
    maxZoom: 7.5
  });
}

/**
 * Hebt eine Route hervor und optional zoomt die Karte darauf.
 * @param {import('maplibre-gl').Map} map
 * @param {string} routeId
 * @param {{statusEl?: HTMLElement | null; fitView?: boolean; padding?: number}} [options]
 */
function setActiveRoute(map, routeId, options = {}) {
  if (!routeId) return;
  const normalizedId = String(routeId);
  const routes = getRouteFeatures(demoData);
  const targetRoute = routes.find((feature) => String(feature.id) === normalizedId);
  if (!targetRoute) return;
  routes.forEach((feature) => {
    if (typeof feature.id === 'undefined') return;
    map.setFeatureState(
      { source: SOURCE_ID, id: feature.id },
      { selected: String(feature.id) === normalizedId }
    );
  });
  if (options.statusEl) {
    const distance = targetRoute.properties?.distance ? ` – ${targetRoute.properties.distance}` : '';
    options.statusEl.textContent = `Aktive Route: ${targetRoute.properties?.name ?? normalizedId}${distance}`;
  }
  if (options.fitView) {
    fitMapToData(
      map,
      { type: 'FeatureCollection', features: [targetRoute] },
      options.padding ?? 72
    );
  }
}

/**
 * Erstellt Auswahloptionen für alle bekannten Routen.
 * @param {HTMLSelectElement} selectEl
 * @param {Array<Feature>} routes
 */
function populateRouteSelect(selectEl, routes) {
  selectEl.innerHTML = '';
  routes.forEach((route) => {
    if (typeof route.id === 'undefined') return;
    const option = document.createElement('option');
    option.value = String(route.id);
    option.textContent = route.properties?.name ?? String(route.id);
    if (route.properties?.distance) {
      option.dataset.distance = route.properties.distance;
    }
    selectEl.appendChild(option);
  });
}

/**
 * Bindet das Dropdown an das Map-State-Management.
 * @param {import('maplibre-gl').Map} map
 * @param {HTMLSelectElement} selectEl
 * @param {HTMLElement | null} statusEl
 */
function setupRouteSelection(map, selectEl, statusEl) {
  const routes = getRouteFeatures(demoData);
  if (!routes.length) return;
  populateRouteSelect(selectEl, routes);
  selectEl.addEventListener('change', () => {
    setActiveRoute(map, selectEl.value, { statusEl, fitView: true });
  });
  const defaultRouteId = String(routes[0].id);
  selectEl.value = defaultRouteId;
  setActiveRoute(map, defaultRouteId, { statusEl });
}

function bindFeatureInteractions(map, callbacks = {}) {
  map.on('click', ROUTE_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const coords = event.lngLat ?? feature.geometry.coordinates[0];
    const content = renderPopupContent(feature, 'route');
    openPopup(map, [coords.lng ?? coords[0], coords.lat ?? coords[1]], content);
    const routeId = feature.id ?? feature.properties?.id;
    if (routeId && typeof callbacks.onRouteSelected === 'function') {
      callbacks.onRouteSelected(String(routeId));
    }
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
    openPopup(map, feature.geometry.coordinates, renderPopupContent(feature, 'poi'));
  });
  map.on('mouseenter', POI_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', POI_LAYER_ID, () => {
    map.getCanvas().style.cursor = '';
  });
}

function renderPopupContent(feature, fallbackLabel) {
  const name = feature.properties?.name ?? fallbackLabel;
  const description = feature.properties?.description ?? '';
  const distance = feature.properties?.distance;
  return `
    <strong>${name}</strong>
    ${distance ? `<p>Distanz: ${distance}</p>` : ''}
    ${description ? `<p>${description}</p>` : ''}
  `;
}

function openPopup(map, coordinates, html) {
  const maplibre = getMapLibre();
  if (activePopup) {
    activePopup.remove();
  }
  activePopup = new maplibre.Popup({ closeButton: false, offset: 18 })
    .setLngLat(coordinates)
    .setHTML(html)
    .addTo(map);
}

function bootstrap() {
  const statusEl = document.getElementById('map-status');
  const routeSelect = /** @type {HTMLSelectElement | null} */ (document.getElementById('route-select'));
  const map = initMap('map');
  map.on('load', () => {
    addGeoJsonSource(map, SOURCE_ID, demoData, { promoteId: 'id' });
    addRouteLayer(map, SOURCE_ID);
    addPoiLayer(map, SOURCE_ID);
    fitMapToData(map, demoData);
    if (routeSelect) {
      setupRouteSelection(map, routeSelect, statusEl);
    }
    bindFeatureInteractions(map, {
      onRouteSelected: (routeId) => {
        if (routeSelect) {
          routeSelect.value = routeId;
        }
        setActiveRoute(map, routeId, { statusEl, fitView: true });
      }
    });
  });
  map.addControl(new getMapLibre().NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new getMapLibre().AttributionControl({ compact: true }));
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrap);
}
