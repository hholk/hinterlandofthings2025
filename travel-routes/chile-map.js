/**
 * Chile Travel Experience – Interaktive Karte
 * -------------------------------------------
 * Dieses Skript läuft ohne Build-Tooling direkt im Browser. Wir lesen die
 * bestehenden JSON-Dateien der Experience ein, erzeugen daraus GeoJSON-Layer
 * und visualisieren die ausgewählte Route mit MapLibre.
 */

/** @typedef {import('geojson').FeatureCollection} FeatureCollection */
/** @typedef {import('geojson').Feature} Feature */
/** @typedef {import('geojson').Geometry} Geometry */

const SEGMENT_SOURCE_ID = 'chile-segments';
const SEGMENT_LAYER_ID = 'chile-segments-line';
const SEGMENT_LAYER_DASHED_ID = 'chile-segments-line-dashed';
const POI_SOURCE_ID = 'chile-pois';
const POI_LAYER_ID = 'chile-pois-circle';
const POI_LABEL_LAYER_ID = 'chile-pois-labels';
const MAP_POPUP_CLASS = 'chile-map-popup';
const MAX_POI_LIST_ITEMS = 6;

const routeCache = new Map();
let travelDataset = null;
let mapInstance = null;
let activePopup = null;
let activeRouteId = null;

const DEFAULT_TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_STYLE = 'https://demotiles.maplibre.org/style.json';

function getMapLibre() {
  const lib = globalThis.maplibregl;
  if (!lib) {
    throw new Error('MapLibre GL JS wurde nicht gefunden.');
  }
  return lib;
}

export function normalizeCoordinate(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length === 2) {
    const [lng, lat] = value;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      return [lng, lat];
    }
  }
  if (typeof value === 'object') {
    const candidate = value;
    if (Number.isFinite(candidate.lng) && Number.isFinite(candidate.lat)) {
      return [candidate.lng, candidate.lat];
    }
  }
  return null;
}

function buildLineString(start, end) {
  const from = normalizeCoordinate(start);
  const to = normalizeCoordinate(end);
  if (!from || !to) return null;
  return { type: 'LineString', coordinates: [from, to] };
}

function pickPrimaryImage(images) {
  if (!Array.isArray(images)) return null;
  return images.find((image) => image && typeof image.url === 'string' && image.url.trim().length > 0) ?? null;
}

function parseDashArray(value) {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const valid = value.filter((entry) => Number.isFinite(entry) && entry > 0);
    return valid.length >= 2 ? valid : undefined;
  }
  if (typeof value === 'string') {
    const numbers = value
      .split(/\s+/)
      .map((entry) => Number.parseFloat(entry))
      .filter((entry) => Number.isFinite(entry) && entry > 0);
    return numbers.length >= 2 ? numbers : undefined;
  }
  return undefined;
}

function resolveModeAppearance(mode, transportModes) {
  const fallback = { color: '#38bdf8', label: mode ?? 'Segment' };
  if (!mode || !transportModes) return { ...fallback };
  const config = transportModes[mode];
  if (!config) {
    return { ...fallback };
  }
  return {
    color: config.color ?? fallback.color,
    label: config.label ?? fallback.label,
    icon: config.icon ?? '',
    dashArray: parseDashArray(config.dashArray)
  };
}

function createSegmentFeature(geometry, appearance, id, mode, order, meta = {}) {
  return {
    type: 'Feature',
    geometry,
    properties: {
      id,
      mode,
      order,
      color: appearance.color,
      label: appearance.label,
      ...(appearance.dashArray ? { dashArray: appearance.dashArray } : {}),
      ...meta
    }
  };
}

/**
 * Für Einsteiger:innen: Wir erzeugen die Linienzüge pro Route on-the-fly.
 * Erst nehmen wir vorhandene GeoJSON-Segmente, anschließend bauen wir
 * Linien aus Stop-Koordinaten oder tagesbasierten An- und Abreisen nach.
 */
export function buildSegmentFeatures(route, transportModes) {
  const features = [];
  if (!route) return features;
  let order = 0;

  if (Array.isArray(route.mapLayers?.dailySegments)) {
    route.mapLayers.dailySegments.forEach((segment, index) => {
      const geometry = segment?.geometry;
      if (!geometry || geometry.type !== 'LineString' || !Array.isArray(geometry.coordinates)) return;
      const normalizedCoordinates = geometry.coordinates
        .map((coord) => normalizeCoordinate(coord))
        .filter(Boolean);
      if (normalizedCoordinates.length < 2) return;
      const appearance = resolveModeAppearance(segment.mode, transportModes);
      features.push(
        createSegmentFeature(
          { type: 'LineString', coordinates: normalizedCoordinates },
          appearance,
          segment.dayId ?? `day-${index + 1}`,
          segment.mode ?? 'segment',
          order,
          { title: segment.title }
        )
      );
      order += 1;
    });
  }

  if (features.length === 0 && Array.isArray(route.segments) && Array.isArray(route.stops)) {
    const stopIndex = new Map((route.stops ?? []).map((stop) => [stop.id, stop]));
    route.segments.forEach((segment, index) => {
      const fromStop = stopIndex.get(segment.from);
      const toStop = stopIndex.get(segment.to);
      const geometry = buildLineString(fromStop?.coordinates, toStop?.coordinates);
      if (!geometry) return;
      const appearance = resolveModeAppearance(segment.mode, transportModes);
      features.push(
        createSegmentFeature(
          geometry,
          appearance,
          segment.id ?? `segment-${index + 1}`,
          segment.mode ?? 'segment',
          order,
          {
            from: fromStop?.name,
            to: toStop?.name,
            distanceKm: segment.distanceKm,
            durationHours: segment.durationHours
          }
        )
      );
      order += 1;
    });
  }

  if (features.length === 0 && Array.isArray(route.days)) {
    route.days.forEach((day, dayIndex) => {
      day.arrival?.segments?.forEach((segment, segmentIndex) => {
        const geometry = buildLineString(segment.from?.coordinates, segment.to?.coordinates);
        if (!geometry) return;
        const appearance = resolveModeAppearance(segment.mode, transportModes);
        features.push(
          createSegmentFeature(
            geometry,
            appearance,
            `${day.id ?? `day-${dayIndex + 1}`}-segment-${segmentIndex + 1}`,
            segment.mode ?? 'segment',
            order,
            { from: segment.from?.name, to: segment.to?.name }
          )
        );
        order += 1;
      });
    });
  }

  return features;
}

/**
 * Sammle Points of Interest. Wir bevorzugen echte Stops, greifen aber auf
 * Stations- und MapPoint-Daten zurück, wenn die Route im Tagesformat vorliegt.
 */
export function buildPoiFeatures(route) {
  const features = [];
  if (!route) return features;
  let order = 0;

  if (Array.isArray(route.stops) && route.stops.length > 0) {
    route.stops.forEach((stop, index) => {
      const coordinate = normalizeCoordinate(stop.coordinates);
      if (!coordinate) return;
      const hero = pickPrimaryImage(stop.photos);
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coordinate },
        properties: {
          id: stop.id ?? `stop-${index + 1}`,
          order,
          name: stop.name ?? stop.city ?? 'Highlight',
          city: stop.city,
          category: stop.type ?? 'station',
          description: stop.description,
          photoUrl: hero?.url,
          photoCredit: hero?.credit ?? hero?.caption
        }
      });
      order += 1;
    });
    return features;
  }

  if (Array.isArray(route.days)) {
    route.days.forEach((day, dayIndex) => {
      const stationCoordinate = normalizeCoordinate(day.station?.coordinates);
      if (stationCoordinate) {
        const hero = pickPrimaryImage(day.station?.images);
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: stationCoordinate },
          properties: {
            id: `${day.id ?? `day-${dayIndex + 1}`}-station`,
            order,
            name: day.station?.name ?? `Station ${dayIndex + 1}`,
            city: day.station?.name,
            category: 'station',
            description: day.station?.description,
            photoUrl: hero?.url,
            photoCredit: hero?.credit ?? hero?.caption
          }
        });
        order += 1;
      }
      day.arrival?.mapPoints?.forEach((point, pointIndex) => {
        const coordinate = normalizeCoordinate(point.coordinates);
        if (!coordinate) return;
        const hero = pickPrimaryImage(point.images);
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: coordinate },
          properties: {
            id: point.id ?? `${day.id ?? 'day'}-poi-${pointIndex + 1}`,
            order,
            name: point.name ?? point.id ?? 'POI',
            city: point.city,
            category: point.type ?? 'poi',
            description: point.description,
            photoUrl: hero?.url,
            photoCredit: hero?.credit ?? hero?.caption
          }
        });
        order += 1;
      });
    });
  }

  return features;
}

function mergeCollections(...collections) {
  return {
    type: 'FeatureCollection',
    features: collections.flatMap((collection) => collection?.features ?? [])
  };
}

function collectCoordinates(geometry, output) {
  if (!geometry) return;
  if (geometry.type === 'Point') {
    const coordinate = normalizeCoordinate(geometry.coordinates);
    if (coordinate) {
      output.push(coordinate);
    }
    return;
  }
  if (geometry.type === 'LineString') {
    geometry.coordinates.forEach((coord) => {
      const normalized = normalizeCoordinate(coord);
      if (normalized) {
        output.push(normalized);
      }
    });
    return;
  }
  const nested = Array.isArray(geometry.coordinates) ? geometry.coordinates.flat(2) : [];
  nested.forEach((coord) => {
    const normalized = normalizeCoordinate(coord);
    if (normalized) {
      output.push(normalized);
    }
  });
}

/**
 * Kompakte Bounding-Box-Berechnung, damit MapLibre jede Route passend einzoomt.
 */
export function calculateBounds(collection) {
  const coordinates = [];
  for (const feature of collection?.features ?? []) {
    collectCoordinates(feature.geometry, coordinates);
  }
  if (!coordinates.length) return null;
  let [minLng, minLat] = coordinates[0];
  let [maxLng, maxLat] = coordinates[0];
  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ];
}

function formatNumber(value, options) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('de-DE', options).format(value);
}

function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value) {
  if (!value) return '';
  const entities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(value).replace(/[&<>"']/g, (char) => entities[char] ?? char);
}

function resolveAssetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

/**
 * Lädt JSON-Dateien immer ohne Cache, damit GitHub Pages sofort aktualisierte
 * Varianten liefert – praktisch beim Debuggen.
 */
async function fetchJson(resource) {
  const response = await fetch(resource, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`(${response.status}) ${response.statusText}`);
  }
  return response.json();
}

async function loadDataset() {
  if (travelDataset) return travelDataset;
  travelDataset = await fetchJson(resolveAssetUrl('./travel-routes-data.json'));
  return travelDataset;
}

async function ensureRouteDetail(id) {
  if (routeCache.has(id)) {
    return routeCache.get(id);
  }
  const dataset = await loadDataset();
  const entry = dataset.routeIndex.find((route) => route.id === id);
  if (!entry) {
    throw new Error('Route nicht gefunden');
  }
  const file = entry.file ?? `data/routes/${entry.id}.json`;
  const detail = await fetchJson(resolveAssetUrl(`./${file.replace(/^\.\//, '')}`));
  routeCache.set(id, detail);
  return detail;
}

function resolveTileTemplates(mapConfig) {
  const source = mapConfig?.tileLayer;
  if (!source) return [DEFAULT_TILE];
  if (Array.isArray(source) && source.length > 0) {
    return source;
  }
  if (typeof source === 'string') {
    if (source.includes('{s}')) {
      const subdomains = mapConfig.tileSubdomains ?? ['a', 'b', 'c'];
      return subdomains.map((domain) => source.replace('{s}', domain));
    }
    return [source];
  }
  return [DEFAULT_TILE];
}

function createMapStyle(mapConfig) {
  if (mapConfig?.styleUrl) {
    return mapConfig.styleUrl;
  }
  return {
    version: 8,
    glyphs: mapConfig?.glyphsUrl ?? 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
    sources: {
      osm: {
        type: 'raster',
        tiles: resolveTileTemplates(mapConfig),
        tileSize: 256,
        attribution: mapConfig?.attribution ?? '© OpenStreetMap',
        maxzoom: 14
      }
    },
    layers: [
      { id: 'osm-base', type: 'raster', source: 'osm' }
    ]
  };
}

function initMap(mapConfig) {
  const maplibre = getMapLibre();
  const map = new maplibre.Map({
    container: 'map',
    style: mapConfig ? createMapStyle(mapConfig) : DEFAULT_STYLE,
    center: mapConfig?.center ?? [-70.5, -30],
    zoom: mapConfig?.zoom ?? 4.2,
    attributionControl: false,
    maxZoom: 10
  });
  map.addControl(new maplibre.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new maplibre.AttributionControl({ compact: true }));
  return map;
}

function setupSources(map) {
  if (!map.getSource(SEGMENT_SOURCE_ID)) {
    map.addSource(SEGMENT_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: SEGMENT_LAYER_ID,
      type: 'line',
      source: SEGMENT_SOURCE_ID,
      filter: ['!', ['has', 'dashArray']],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#38bdf8'],
        'line-width': 4.5,
        'line-opacity': 0.9
      }
    });
    map.addLayer({
      id: SEGMENT_LAYER_DASHED_ID,
      type: 'line',
      source: SEGMENT_SOURCE_ID,
      filter: ['has', 'dashArray'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ['coalesce', ['get', 'color'], '#38bdf8'],
        'line-width': 4.5,
        'line-dasharray': ['get', 'dashArray'],
        'line-opacity': 0.9
      }
    });
  }

  if (!map.getSource(POI_SOURCE_ID)) {
    map.addSource(POI_SOURCE_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: POI_LAYER_ID,
      type: 'circle',
      source: POI_SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4, 8, 9],
        'circle-color': [
          'match',
          ['get', 'category'],
          'airport', '#f97316',
          'station', '#facc15',
          'highlight', '#a5b4fc',
          'coast', '#7dd3fc',
          'city', '#fb7185',
          '#facc15'
        ],
        'circle-stroke-color': '#0f172a',
        'circle-stroke-width': 2,
        'circle-opacity': 0.92
      }
    });
    map.addLayer({
      id: POI_LABEL_LAYER_ID,
      type: 'symbol',
      source: POI_SOURCE_ID,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 8, 12],
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular']
      },
      paint: {
        'text-color': '#e2e8f0',
        'text-halo-color': '#0f172a',
        'text-halo-width': 1.1
      }
    });
  }
}

function updateMapCollections(map, segments, pois) {
  const segmentSource = map.getSource(SEGMENT_SOURCE_ID);
  const poiSource = map.getSource(POI_SOURCE_ID);
  if (segmentSource) {
    segmentSource.setData(segments);
  }
  if (poiSource) {
    poiSource.setData(pois);
  }
}

function fitMapToCollections(map, segments, pois) {
  const combined = mergeCollections(segments, pois);
  const bounds = calculateBounds(combined);
  if (!bounds) return;
  const maplibre = getMapLibre();
  const lngLatBounds = new maplibre.LngLatBounds(bounds[0], bounds[1]);
  map.fitBounds(lngLatBounds, {
    padding: { top: 40, right: 60, bottom: 80, left: 60 },
    maxZoom: 8.5,
    duration: 700
  });
}

function removePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
}

function renderSegmentPopup(feature) {
  const mode = feature.properties?.label ?? feature.properties?.mode ?? 'Segment';
  const from = feature.properties?.from;
  const to = feature.properties?.to;
  const parts = [mode];
  if (from && to) {
    parts.push(`${from} → ${to}`);
  }
  if (feature.properties?.distanceKm) {
    parts.push(`${formatNumber(feature.properties.distanceKm)} km`);
  }
  if (feature.properties?.durationHours) {
    parts.push(`${formatNumber(feature.properties.durationHours, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`);
  }
  return `<strong>${escapeHtml(mode)}</strong>${parts.length > 1 ? `<p>${escapeHtml(parts.slice(1).join(' • '))}</p>` : ''}`;
}

function renderPoiPopup(feature) {
  const title = feature.properties?.name ?? 'Highlight';
  const description = feature.properties?.description;
  const meta = [feature.properties?.city, feature.properties?.category]
    .filter(Boolean)
    .map((value) => escapeHtml(value))
    .join(' • ');
  const lines = [`<strong>${escapeHtml(title)}</strong>`];
  if (meta) {
    lines.push(`<p>${meta}</p>`);
  }
  if (description) {
    lines.push(`<p>${escapeHtml(description)}</p>`);
  }
  if (feature.properties?.photoUrl) {
    const credit = feature.properties?.photoCredit ? `<figcaption>${escapeHtml(feature.properties.photoCredit)}</figcaption>` : '';
    lines.unshift(
      `<figure><img src="${escapeHtml(feature.properties.photoUrl)}" alt="${escapeHtml(title)}" loading="lazy" decoding="async" />${credit}</figure>`
    );
  }
  return lines.join('');
}

function bindInteractions(map) {
  map.on('click', SEGMENT_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry?.type !== 'LineString') return;
    removePopup();
    const coords = event.lngLat ?? feature.geometry.coordinates[0];
    activePopup = new getMapLibre().Popup({ closeButton: false, offset: 18, className: MAP_POPUP_CLASS })
      .setLngLat([coords.lng ?? coords[0], coords.lat ?? coords[1]])
      .setHTML(renderSegmentPopup(feature))
      .addTo(map);
  });

  map.on('click', POI_LAYER_ID, (event) => {
    const feature = event.features?.[0];
    if (!feature || feature.geometry?.type !== 'Point') return;
    removePopup();
    activePopup = new getMapLibre().Popup({ closeButton: false, offset: 18, className: MAP_POPUP_CLASS })
      .setLngLat(feature.geometry.coordinates)
      .setHTML(renderPoiPopup(feature))
      .addTo(map);
  });

  map.on('mouseenter', SEGMENT_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', SEGMENT_LAYER_ID, () => {
    map.getCanvas().style.cursor = '';
  });
  map.on('mouseenter', POI_LAYER_ID, () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', POI_LAYER_ID, () => {
    map.getCanvas().style.cursor = '';
  });
}

function renderLegend(transportModes, legendEl) {
  if (!legendEl) return;
  const entries = Object.values(transportModes ?? {});
  legendEl.innerHTML = entries
    .map((mode) => {
      return `<div class="map-legend__item">
        <span class="map-legend__swatch" style="${mode.dashArray ? `background:transparent;border-top:4px dashed ${mode.color ?? '#38bdf8'}` : `background:${mode.color ?? '#38bdf8'}`}"></span>
        <div>
          <div>${mode.icon ?? ''} ${escapeHtml(mode.label ?? '')}</div>
          <small>${escapeHtml(mode.description ?? '')}</small>
        </div>
      </div>`;
    })
    .join('');
}

function renderRouteInfo(entry, detail, dom) {
  if (!dom.routeTitle || !dom.routeSummary || !dom.routeMeta) return;
  dom.routeTitle.textContent = entry?.name ?? detail?.name ?? 'Unbenannte Route';
  dom.routeSummary.textContent = detail?.summary ?? entry?.summary ?? 'Keine Zusammenfassung vorhanden.';
  const metaItems = [];
  const duration = detail?.meta?.durationDays ?? entry?.meta?.durationDays;
  if (duration) {
    metaItems.push(`<li><span>Tage</span><strong>${duration}</strong></li>`);
  }
  const budget = detail?.meta?.costEstimate ?? entry?.meta?.costEstimate;
  if (budget) {
    metaItems.push(`<li><span>Kostenschätzung</span><strong>${formatCurrency(budget) ?? budget}</strong></li>`);
  }
  const distance = detail?.metrics?.totalDistanceKm ?? entry?.metrics?.totalDistanceKm;
  if (distance) {
    metaItems.push(`<li><span>Distanz</span><strong>${formatNumber(distance)} km</strong></li>`);
  }
  const carbon = detail?.metrics?.estimatedCarbonKg ?? entry?.metrics?.estimatedCarbonKg;
  if (carbon) {
    metaItems.push(`<li><span>CO₂</span><strong>${formatNumber(carbon)} kg</strong></li>`);
  }
  dom.routeMeta.innerHTML = metaItems.join('');
}

function renderModeList(segmentFeatures, transportModes, dom) {
  if (!dom.modeList) return;
  if (!segmentFeatures.length) {
    dom.modeList.innerHTML = '<li>Keine Segmente vorhanden.</li>';
    return;
  }
  const summary = new Map();
  segmentFeatures.forEach((feature) => {
    const appearance = resolveModeAppearance(feature.properties?.mode, transportModes);
    const key = feature.properties?.mode ?? 'segment';
    if (!summary.has(key)) {
      summary.set(key, { count: 0, label: appearance.label, icon: transportModes?.[key]?.icon ?? '', color: appearance.color });
    }
    summary.get(key).count += 1;
  });
  dom.modeList.innerHTML = Array.from(summary.entries())
    .map(([mode, info]) => `<li><span>${transportModes?.[mode]?.icon ?? ''} ${escapeHtml(info.label)}</span><span>${info.count} Etappen</span></li>`)
    .join('');
}

function renderPoiList(poiFeatures, dom) {
  if (!dom.poiList) return;
  if (!poiFeatures.length) {
    dom.poiList.innerHTML = '<li>Keine Highlights im Datensatz.</li>';
    return;
  }
  const sorted = [...poiFeatures].sort((a, b) => (a.properties?.order ?? 0) - (b.properties?.order ?? 0));
  dom.poiList.innerHTML = sorted
    .slice(0, MAX_POI_LIST_ITEMS)
    .map((feature) => {
      const name = feature.properties?.name ?? 'Highlight';
      const subtitle = [feature.properties?.city, feature.properties?.category].filter(Boolean).join(' • ');
      return `<li><strong>${escapeHtml(name)}</strong>${subtitle ? `<small>${escapeHtml(subtitle)}</small>` : ''}</li>`;
    })
    .join('');
}

function populateRouteSelect(selectEl, routeIndex) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  routeIndex.forEach((entry) => {
    const option = document.createElement('option');
    option.value = entry.id;
    option.textContent = entry.name ?? entry.summary ?? entry.id;
    selectEl.appendChild(option);
  });
}

async function handleRouteSelection(routeId, dom) {
  if (!routeId || !travelDataset || !mapInstance) return;
  dom.status.textContent = 'Lade Route …';
  try {
    const entry = travelDataset.routeIndex.find((item) => item.id === routeId);
    if (!entry) {
      throw new Error('Route nicht gefunden');
    }
    const detail = await ensureRouteDetail(routeId);
    const segments = { type: 'FeatureCollection', features: buildSegmentFeatures(detail, travelDataset.transportModes) };
    const pois = { type: 'FeatureCollection', features: buildPoiFeatures(detail) };
    updateMapCollections(mapInstance, segments, pois);
    fitMapToCollections(mapInstance, segments, pois);
    renderRouteInfo(entry, detail, dom);
    renderModeList(segments.features, travelDataset.transportModes, dom);
    renderPoiList(pois.features, dom);
    dom.status.textContent = `Aktive Route: ${entry.name ?? routeId}`;
    activeRouteId = routeId;
  } catch (error) {
    console.error('Route konnte nicht geladen werden', error);
    dom.status.textContent = `Fehler: ${error instanceof Error ? error.message : 'Unbekannt'}`;
  }
}

/**
 * Einstiegspunkt: HTML-Elemente referenzieren, Daten laden, MapLibre starten.
 */
async function bootstrap() {
  const dom = {
    select: document.getElementById('route-select'),
    status: document.getElementById('map-status'),
    legend: document.getElementById('map-legend'),
    routeTitle: document.getElementById('route-title'),
    routeSummary: document.getElementById('route-summary'),
    routeMeta: document.getElementById('route-meta'),
    modeList: document.getElementById('mode-list'),
    poiList: document.getElementById('poi-list')
  };

  try {
    await loadDataset();
  } catch (error) {
    console.error('Dataset konnte nicht geladen werden', error);
    if (dom.status) {
      dom.status.textContent = `Fehler beim Laden der Basisdaten: ${error instanceof Error ? error.message : 'Unbekannt'}`;
    }
    return;
  }

  populateRouteSelect(dom.select, travelDataset.routeIndex);
  renderLegend(travelDataset.transportModes, dom.legend);

  mapInstance = initMap(travelDataset.meta?.map ?? null);
  mapInstance.on('load', () => {
    setupSources(mapInstance);
    bindInteractions(mapInstance);
    const defaultRoute = dom.select?.value || travelDataset.routeIndex[0]?.id;
    if (defaultRoute) {
      void handleRouteSelection(defaultRoute, dom);
    }
  });

  dom.select?.addEventListener('change', () => {
    if (dom.select) {
      void handleRouteSelection(dom.select.value, dom);
    }
  });
}

if (typeof document !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    void bootstrap();
  });
}
