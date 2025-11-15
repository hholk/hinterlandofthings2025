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

let activePopup = null;

// Demo-Daten: eine Route (LineString) plus mehrere Points of Interest
export const demoData = /** @type {FeatureCollection} */ ({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-70.6693, -33.4489], // Santiago de Chile
          [-71.6127, -33.0461], // Valparaíso
          [-70.4025, -23.6509], // Antofagasta
          [-68.2039, -22.9092], // Calama
          [-68.2005, -22.9111], // San Pedro de Atacama
          [-67.8121, -22.3252] // Valle de la Luna
        ]
      },
      properties: {
        name: 'Anden & Atacama Explorer',
        description: 'Von der Hauptstadt bis in die trockenste Wüste der Welt.',
        category: 'route',
        color: '#38bdf8',
        distance: '1.400 km'
      }
    },
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
    })
  ]
});

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
 */
export function addGeoJsonSource(map, sourceId, data) {
  if (map.getSource(sourceId)) {
    map.getSource(sourceId).setData(data);
    return;
  }
  map.addSource(sourceId, { type: 'geojson', data });
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
      'line-color': ['coalesce', ['get', 'color'], '#38bdf8'],
      'line-width': 4,
      'line-opacity': 0.9
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

function bindFeatureInteractions(map) {
  map.on('click', ROUTE_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature) return;
    const coords = event.lngLat ?? feature.geometry.coordinates[0];
    const content = renderPopupContent(feature, 'route');
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
  const map = initMap('map');
  map.on('load', () => {
    addGeoJsonSource(map, SOURCE_ID, demoData);
    addRouteLayer(map, SOURCE_ID);
    addPoiLayer(map, SOURCE_ID);
    fitMapToData(map, demoData);
    bindFeatureInteractions(map);
    if (statusEl) {
      statusEl.textContent = 'Route und Highlights geladen.';
    }
  });
  map.addControl(new getMapLibre().NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new getMapLibre().AttributionControl({ compact: true }));
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', bootstrap);
}
