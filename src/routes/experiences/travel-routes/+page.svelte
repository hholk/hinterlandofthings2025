<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PageData } from './$types';
  import type {
    RouteDetail,
    RouteIndexEntry,
    RouteStop,
    DayDefinition,
    DayArrivalSegment,
    LoadedTravelRoutesDataset,
    MobilityOption,
    DailySegmentDefinition
  } from '../../../lib/data/chile-travel';
  import type { FeatureCollection, Geometry } from 'geojson';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { calculateBoundingBox, type LngLatTuple } from '../../../lib/travel/map-bounds';

  type MapLibreModule = typeof import('maplibre-gl');
  type MapLibreMap = import('maplibre-gl').Map;
  type MapLayerMouseEvent = import('maplibre-gl').MapLayerMouseEvent;
  type Popup = import('maplibre-gl').Popup;
  type GeoJSONSource = import('maplibre-gl').GeoJSONSource;
  type StyleSpecification = import('maplibre-gl').StyleSpecification;

  export let data: PageData & { travel: LoadedTravelRoutesDataset };

  interface SegmentProperties {
    id: string;
    mode: string;
    order: number;
    color: string;
    label: string;
    dashArray: number[] | null;
  }

  interface StopProperties {
    id: string;
    name: string;
    order: number;
    label: string;
    title: string;
    subtitle?: string;
    type?: string;
  }

  interface TimelineStep {
    order: number;
    label: string;
    description?: string;
    dayId?: string;
  }

  type SegmentCollection = FeatureCollection<Geometry, SegmentProperties>;
  type StopCollection = FeatureCollection<Geometry, StopProperties>;

  const EMPTY_SEGMENTS: SegmentCollection = { type: 'FeatureCollection', features: [] };
  const EMPTY_STOPS: StopCollection = { type: 'FeatureCollection', features: [] };

  const ROUTE_SEGMENT_SOURCE = 'travel-route-segments';
  const ROUTE_SEGMENT_LAYER = 'travel-route-segments-layer';
  const ROUTE_STOP_SOURCE = 'travel-route-stops';
  const ROUTE_STOP_LAYER = 'travel-route-stops-layer';
  const ROUTE_STOP_LABEL_LAYER = 'travel-route-stop-label-layer';
  const STOP_POPUP_CLASS = 'travel-map-popup';
  const FULLSCREEN_BODY_CLASS = 'travel-map-fullscreen-open';

  let selectedRouteId = data.travel.routeIndex[0]?.id ?? '';
  let selectedRoute: RouteDetail | null = data.travel.routes[selectedRouteId] ?? null;
  let selectedIndexEntry: RouteIndexEntry | null =
    data.travel.routeIndex.find((entry) => entry.id === selectedRouteId) ?? null;

  let segmentCollection: SegmentCollection = EMPTY_SEGMENTS;
  let stopCollection: StopCollection = EMPTY_STOPS;
  let allCoordinates: LngLatTuple[] = [];
  let sliderSteps: TimelineStep[] = [];
  let sliderValue = 0;
  let sliderMax = 0;
  let sliderLabel = '';

  let mapContainer: HTMLDivElement | null = null;
  let mapInstance: MapLibreMap | null = null;
  let maplibre: MapLibreModule | null = null;
  let mapLoaded = false;
  let loadError: string | null = null;
  let resizeCleanup: (() => void) | null = null;
  let activePopup: Popup | null = null;
  let isMapFullscreen = false;
  let isLegendVisible = true;

  const hasDocument = typeof document !== 'undefined';

  const numberFormatter = new Intl.NumberFormat('de-DE');
  const decimalFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
  const currencyFormatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: data.travel.meta.currency ?? 'EUR'
  });

  function setBodyScrollLock(shouldLock: boolean) {
    if (!hasDocument) return;
    document.body.classList.toggle(FULLSCREEN_BODY_CLASS, shouldLock);
  }

  function updateScrollZoom(enabled: boolean) {
    if (!mapInstance) return;
    if (enabled) {
      mapInstance.scrollZoom.enable();
    } else {
      mapInstance.scrollZoom.disable();
    }
  }

  function selectRoute(id: string) {
    if (id === selectedRouteId) return;
    selectedRouteId = id;
    sliderValue = 0;
    removeMapPopup();
  }

  function addBodyTheme() {
    if (!hasDocument) return;
    document.body.classList.add('travel-body');
  }

  function removeBodyTheme() {
    if (!hasDocument) return;
    document.body.classList.remove('travel-body');
  }

  async function toggleMapFullscreen() {
    isMapFullscreen = !isMapFullscreen;
    setBodyScrollLock(isMapFullscreen);
    updateScrollZoom(isMapFullscreen);
    await tick();

    if (mapLoaded && selectedRoute) {
      mapInstance?.resize();
      ensureMapBounds();
    }
  }

  function closeMapFullscreen() {
    if (!isMapFullscreen) return;
    void toggleMapFullscreen();
  }

  function toggleLegendVisibility() {
    isLegendVisible = !isLegendVisible;
  }

  function normalizeCoordinate(value: unknown): [number, number] | null {
    if (!value) return null;
    if (Array.isArray(value) && value.length === 2) {
      const [lng, lat] = value;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        return [lng, lat];
      }
    }
    if (typeof value === 'object') {
      const candidate = value as { lat?: number; lng?: number };
      if (Number.isFinite(candidate.lng) && Number.isFinite(candidate.lat)) {
        return [candidate.lng as number, candidate.lat as number];
      }
    }
    return null;
  }

  function buildLineCoordinates(from: unknown, to: unknown): [number, number][] | null {
    const start = normalizeCoordinate(from);
    const end = normalizeCoordinate(to);
    if (!start || !end) return null;
    return [start, end];
  }

  function parseDashArray(value: string | null | undefined): number[] | null {
    if (!value) return null;
    const parts = value
      .split(/\s+/)
      .map((part) => Number.parseFloat(part))
      .filter((part) => Number.isFinite(part) && part > 0);
    return parts.length >= 2 ? parts : null;
  }

  function resolveModeAppearance(mode: string | undefined): Pick<SegmentProperties, 'color' | 'dashArray' | 'label'> {
    if (!mode) {
      return { color: '#2563eb', dashArray: null, label: 'Segment' };
    }
    const transport = data.travel.transportModes[mode];
    if (!transport) {
      return { color: '#2563eb', dashArray: null, label: mode };
    }
    return {
      color: transport.color,
      dashArray: parseDashArray(transport.dashArray),
      label: transport.label ?? mode
    };
  }

  function buildSegmentCollection(route: RouteDetail | null): SegmentCollection {
    if (!route) return EMPTY_SEGMENTS;
    const features: SegmentCollection['features'] = [];
    let order = 0;

    if (Array.isArray(route.mapLayers?.dailySegments) && route.mapLayers.dailySegments.length > 0) {
      route.mapLayers.dailySegments.forEach((segment: DailySegmentDefinition, index) => {
        const geometry = segment.geometry;
        if (!geometry || geometry.type !== 'LineString') return;
        const appearance = resolveModeAppearance(segment.mode);
        features.push({
          type: 'Feature',
          geometry,
          properties: {
            id: segment.dayId ?? `day-${index + 1}`,
            mode: segment.mode ?? 'segment',
            order,
            color: appearance.color,
            label: appearance.label,
            dashArray: appearance.dashArray
          }
        });
        order += 1;
      });
    }

    if (features.length === 0 && Array.isArray(route.segments) && Array.isArray(route.stops)) {
      const stopIndex = new Map(route.stops.map((stop) => [stop.id, stop] as const));
      route.segments.forEach((segment, index) => {
        const fromStop = stopIndex.get(segment.from);
        const toStop = stopIndex.get(segment.to);
        const coordinates = buildLineCoordinates(fromStop?.coordinates, toStop?.coordinates);
        if (!coordinates) return;
        const appearance = resolveModeAppearance(segment.mode);
        features.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {
            id: segment.id ?? `segment-${index + 1}`,
            mode: segment.mode ?? 'segment',
            order,
            color: appearance.color,
            label: appearance.label,
            dashArray: appearance.dashArray
          }
        });
        order += 1;
      });
    }

    if (features.length === 0 && Array.isArray(route.days)) {
      route.days.forEach((day: DayDefinition, dayIndex) => {
        day.arrival?.segments?.forEach((segment: DayArrivalSegment, segmentIndex) => {
          const coordinates = buildLineCoordinates(segment.from?.coordinates, segment.to?.coordinates);
          if (!coordinates) return;
          const appearance = resolveModeAppearance(segment.mode ?? 'segment');
          features.push({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates
            },
            properties: {
              id: `${day.id}-segment-${segmentIndex + 1}`,
              mode: segment.mode ?? 'segment',
              order,
              color: appearance.color,
              label: `${appearance.label} (${day.station?.name ?? `Tag ${dayIndex + 1}`})`,
              dashArray: appearance.dashArray
            }
          });
          order += 1;
        });
      });
    }

    return { type: 'FeatureCollection', features };
  }

  function buildStopCollection(route: RouteDetail | null): StopCollection {
    if (!route) return EMPTY_STOPS;
    const features: StopCollection['features'] = [];

    if (Array.isArray(route.stops) && route.stops.length > 0) {
      route.stops.forEach((stop: RouteStop, index) => {
        const coordinate = normalizeCoordinate(stop.coordinates);
        if (!coordinate) return;
        features.push({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: coordinate
          },
          properties: {
            id: stop.id,
            name: stop.name ?? stop.city ?? `Stop ${index + 1}`,
            order: index,
            label: String(index + 1),
            title: stop.name ?? stop.city ?? stop.id,
            subtitle: stop.city ?? stop.type,
            type: stop.type
          }
        });
      });
    } else if (Array.isArray(route.days)) {
      route.days.forEach((day: DayDefinition, index) => {
        const coordinate = normalizeCoordinate(day.station?.coordinates);
        if (coordinate) {
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: coordinate
            },
            properties: {
              id: `${day.id}-station`,
              name: day.station?.name ?? `Station ${index + 1}`,
              order: index,
              label: String(index + 1),
              title: day.station?.name ?? `Station ${index + 1}`,
              subtitle: day.date,
              type: 'station'
            }
          });
        }
        day.arrival?.mapPoints?.forEach((point, pointIndex) => {
          const pointCoordinate = normalizeCoordinate(point.coordinates);
          if (!pointCoordinate) return;
          const orderValue = index + pointIndex / 10 + 0.01;
          features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: pointCoordinate },
            properties: {
              id: point.id,
              name: point.name ?? point.id,
              order: orderValue,
              label: String(index + 1),
              title: point.name ?? point.id,
              subtitle: point.type,
              type: point.type
            }
          });
        });
      });
    }

    return { type: 'FeatureCollection', features };
  }

  function collectAllCoordinates(segments: SegmentCollection, stops: StopCollection): LngLatTuple[] {
    const coordinates: LngLatTuple[] = [];
    for (const feature of segments.features) {
      if (feature.geometry.type === 'LineString') {
        feature.geometry.coordinates.forEach((coordinate) => {
          const normalized = normalizeCoordinate(coordinate);
          if (normalized) {
            coordinates.push(normalized);
          }
        });
      }
    }
    for (const feature of stops.features) {
      if (feature.geometry.type === 'Point') {
        const normalized = normalizeCoordinate(feature.geometry.coordinates);
        if (normalized) {
          coordinates.push(normalized);
        }
      }
    }
    return coordinates;
  }

  function buildTimeline(route: RouteDetail | null, entry: RouteIndexEntry | null): TimelineStep[] {
    if (!route) return [];
    const steps: TimelineStep[] = [];

    if (Array.isArray(route.days) && route.days.length > 0) {
      route.days.forEach((day: DayDefinition, index) => {
        const label = `Tag ${index + 1}: ${day.station?.name ?? 'Etappe'}`;
        const descriptionParts: string[] = [];
        if (day.date) descriptionParts.push(formatDate(day.date));
        if (day.arrival?.segments?.length) {
          const firstSegment = day.arrival.segments[0];
          const appearance = resolveModeAppearance(firstSegment.mode ?? 'segment');
          descriptionParts.push(appearance.label);
        }
        steps.push({
          order: index,
          label,
          description: descriptionParts.join(' • ') || undefined,
          dayId: day.id
        });
      });
      return steps;
    }

    if (Array.isArray(route.segments) && route.segments.length > 0 && Array.isArray(route.stops)) {
      const stopMap = new Map(route.stops.map((stop) => [stop.id, stop] as const));
      route.segments.forEach((segment, index) => {
        const from = stopMap.get(segment.from);
        const to = stopMap.get(segment.to);
        const appearance = resolveModeAppearance(segment.mode);
        const labelParts = [appearance.label];
        if (from?.name && to?.name) {
          labelParts.push(`${from.name} → ${to.name}`);
        }
        const descriptionParts: string[] = [];
        if (segment.distanceKm) {
          descriptionParts.push(`${numberFormatter.format(segment.distanceKm)} km`);
        }
        if (segment.durationHours) {
          descriptionParts.push(`${decimalFormatter.format(segment.durationHours)} h`);
        }
        steps.push({
          order: index,
          label: labelParts.join(' – '),
          description: descriptionParts.join(' • ') || undefined
        });
      });
      return steps;
    }

    if (Array.isArray(route.stops) && route.stops.length > 0) {
      route.stops.forEach((stop, index) => {
        steps.push({
          order: index,
          label: `Stop ${index + 1}: ${stop.name ?? stop.city ?? stop.id}`,
          description: stop.city ?? stop.type
        });
      });
      return steps;
    }

    if (entry?.meta?.durationDays) {
      for (let index = 0; index < entry.meta.durationDays; index += 1) {
        steps.push({ order: index, label: `Tag ${index + 1}` });
      }
    }
    return steps;
  }

  function createRasterStyle(): StyleSpecification {
    const map = data.travel.meta.map;
    return {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        osm: {
          type: 'raster',
          tiles: [map.tileLayer],
          tileSize: 256,
          attribution: map.attribution ?? '© OpenStreetMap',
          maxzoom: 14
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
  }

  function ensureMapBounds() {
    if (!mapInstance || !maplibre) return;
    const boundingBox = calculateBoundingBox(allCoordinates);
    if (!boundingBox) return;

    const bounds = new maplibre.LngLatBounds(boundingBox[0], boundingBox[1]);
    const prefersReducedMotion =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 720;
    const paddingValue = isNarrow ? 140 : 80;

    mapInstance.fitBounds(bounds, {
      padding: { top: 48, right: paddingValue, bottom: paddingValue + 32, left: paddingValue },
      duration: prefersReducedMotion ? 0 : 800,
      maxZoom: 12
    });
  }

  function removeMapPopup() {
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }
  }

  function setupSources() {
    if (!mapInstance) return;
    if (!mapInstance.getSource(ROUTE_SEGMENT_SOURCE)) {
      mapInstance.addSource(ROUTE_SEGMENT_SOURCE, {
        type: 'geojson',
        data: segmentCollection
      });
      mapInstance.addLayer({
        id: ROUTE_SEGMENT_LAYER,
        type: 'line',
        source: ROUTE_SEGMENT_SOURCE,
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#2563eb'],
          'line-width': [
            'case',
            ['==', ['get', 'mode'], 'flight'],
            3.2,
            4.2
          ],
          'line-opacity': 0.9,
          'line-dasharray': ['coalesce', ['get', 'dashArray'], ['literal', [0.0001, 0.0001]]]
        }
      });
    }

    if (!mapInstance.getSource(ROUTE_STOP_SOURCE)) {
      mapInstance.addSource(ROUTE_STOP_SOURCE, {
        type: 'geojson',
        data: stopCollection
      });
      mapInstance.addLayer({
        id: ROUTE_STOP_LAYER,
        type: 'circle',
        source: ROUTE_STOP_SOURCE,
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#1e293b',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-opacity': 0.95
        }
      });
      mapInstance.addLayer({
        id: ROUTE_STOP_LABEL_LAYER,
        type: 'symbol',
        source: ROUTE_STOP_SOURCE,
        layout: {
          'text-field': ['get', 'label'],
          'text-size': 11,
          'text-offset': [0, 1.2],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
        },
        paint: {
          'text-color': '#0f172a',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1
        }
      });
    }
  }

  function updateMapData() {
    if (!mapInstance) return;
    const segmentSource = mapInstance.getSource(ROUTE_SEGMENT_SOURCE) as GeoJSONSource | undefined;
    const stopSource = mapInstance.getSource(ROUTE_STOP_SOURCE) as GeoJSONSource | undefined;

    if (!segmentSource || !stopSource) {
      setupSources();
      return updateMapData();
    }

    segmentSource.setData(segmentCollection);
    stopSource.setData(stopCollection);
    ensureMapBounds();
    updateMapVisibility();
  }

  function createOpacityExpression(threshold: number) {
    return ['case', ['<=', ['get', 'order'], threshold], 0.94, 0.18];
  }

  function createStopOpacityExpression(threshold: number) {
    return ['case', ['<=', ['get', 'order'], threshold], 1, 0.3];
  }

  function updateMapVisibility() {
    if (!mapInstance) return;
    if (!mapInstance.getLayer(ROUTE_SEGMENT_LAYER)) return;

    const threshold = sliderValue;
    mapInstance.setPaintProperty(ROUTE_SEGMENT_LAYER, 'line-opacity', createOpacityExpression(threshold));
    mapInstance.setPaintProperty(ROUTE_STOP_LAYER, 'circle-opacity', createStopOpacityExpression(threshold));
    mapInstance.setPaintProperty(ROUTE_STOP_LAYER, 'circle-stroke-opacity', createStopOpacityExpression(threshold));
    mapInstance.setPaintProperty(
      ROUTE_STOP_LABEL_LAYER,
      'text-opacity',
      ['case', ['<=', ['get', 'order'], threshold], 0.94, 0]
    );
  }

  function handleStopClick(event: MapLayerMouseEvent) {
    if (!mapInstance || !maplibre) return;
    const feature = event.features?.[0];
    if (!feature || feature.geometry.type !== 'Point') return;

    const coordinates = feature.geometry.coordinates as [number, number];
    const title = typeof feature.properties?.title === 'string' ? feature.properties.title : '';
    const subtitle = typeof feature.properties?.subtitle === 'string' ? feature.properties.subtitle : '';

    removeMapPopup();

    activePopup = new maplibre.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: [0, 12],
      maxWidth: '240px',
      className: STOP_POPUP_CLASS
    })
      .setLngLat(coordinates)
      .setHTML(`<strong>${title}</strong>${subtitle ? `<div>${subtitle}</div>` : ''}`)
      .addTo(mapInstance);
  }

  async function ensureMapLibre(): Promise<MapLibreModule | null> {
    if (typeof window === 'undefined') return null;
    if (maplibre) return maplibre;

    const module = await import('maplibre-gl');
    maplibre = module;
    return maplibre;
  }

  onMount(() => {
    if (!mapContainer) return;

    let cancelled = false;

    const boot = async () => {
      try {
        const module = await ensureMapLibre();
        if (!module || cancelled || !mapContainer) return;

        maplibre = module;
        loadError = null;

        const map = new module.Map({
          container: mapContainer,
          style: createRasterStyle(),
          center: data.travel.meta.map.center,
          zoom: data.travel.meta.map.zoom,
          maxZoom: 12,
          attributionControl: false,
          scrollZoom: false
        });

        mapInstance = map;

        map.dragRotate.disable();
        map.touchZoomRotate.enable();
        map.touchZoomRotate.enableRotation();

        map.addControl(new module.NavigationControl({ showCompass: false }), 'top-right');
        map.addControl(new module.AttributionControl({ compact: true }));

        map.on('load', () => {
          if (cancelled) return;
          setupSources();
          mapLoaded = true;
          updateMapData();
        });

        map.on('click', ROUTE_STOP_LAYER, handleStopClick);
        map.on('mouseenter', ROUTE_STOP_LAYER, () => {
          if (mapInstance) {
            mapInstance.getCanvas().style.cursor = 'pointer';
          }
        });
        map.on('mouseleave', ROUTE_STOP_LAYER, () => {
          if (mapInstance) {
            mapInstance.getCanvas().style.cursor = '';
          }
        });

        if (typeof window !== 'undefined') {
          if ('ResizeObserver' in window && mapContainer) {
            const observer = new ResizeObserver(() => {
              mapInstance?.resize();
            });
            observer.observe(mapContainer);
            resizeCleanup = () => observer.disconnect();
          } else {
            const resizeHandler = () => mapInstance?.resize();
            window.addEventListener('resize', resizeHandler, { passive: true });
            resizeCleanup = () => window.removeEventListener('resize', resizeHandler);
          }
        }
      } catch (error) {
        loadError = error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der Karte';
      }
    };

    addBodyTheme();
    void boot();

    return () => {
      cancelled = true;
      resizeCleanup?.();
      resizeCleanup = null;
      removeMapPopup();
      setBodyScrollLock(false);
      updateScrollZoom(false);

      if (mapInstance) {
        mapInstance.off('click', ROUTE_STOP_LAYER, handleStopClick);
        mapInstance.remove();
        mapInstance = null;
      }

      mapLoaded = false;
      removeBodyTheme();
    };
  });

  function formatNumber(value: number | undefined, options?: Intl.NumberFormatOptions) {
    if (value === undefined || Number.isNaN(value)) return null;
    return new Intl.NumberFormat('de-DE', options).format(value);
  }

  function formatCurrency(value: number | undefined) {
    if (value === undefined || Number.isNaN(value)) return null;
    return currencyFormatter.format(value);
  }

  function formatDate(value: string | undefined) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: 'long'
    }).format(date);
  }

  function mobilitySummary(option: MobilityOption | undefined) {
    if (!option) return null;
    const parts: string[] = [];
    if (option.summary) parts.push(option.summary);
    if (option.price) parts.push(formatCurrency(option.price) ?? '');
    if (option.durationMinutes) parts.push(`${option.durationMinutes} min`);
    if (option.distanceKm) parts.push(`${option.distanceKm} km`);
    return parts.filter(Boolean).join(' • ');
  }

  $: selectedIndexEntry = data.travel.routeIndex.find((entry) => entry.id === selectedRouteId) ?? null;
  $: selectedRoute = data.travel.routes[selectedRouteId] ?? null;
  $: segmentCollection = buildSegmentCollection(selectedRoute);
  $: stopCollection = buildStopCollection(selectedRoute);
  $: allCoordinates = collectAllCoordinates(segmentCollection, stopCollection);
  $: sliderSteps = buildTimeline(selectedRoute, selectedIndexEntry);
  $: sliderMax = sliderSteps.length > 0 ? sliderSteps.length - 1 : 0;
  $: sliderLabel = sliderSteps[sliderValue]?.label ?? 'Start';
  $: if (sliderValue > sliderMax) {
    sliderValue = sliderMax;
  }
  $: if (mapLoaded) {
    updateMapData();
  }
  $: if (mapLoaded) {
    updateMapVisibility();
  }
</script>

<svelte:head>
  <title>{data.experience?.title ?? 'Chile Travel Experience'}</title>
  <meta
    name="description"
    content={
      data.experience?.description ??
        'Interaktive Chile-Routen mit Karte, detaillierten Stopps und Logistik-Tipps.'
    }
  />
  <!-- Für Einsteiger:innen: Die MapLibre-Styles werden über den JS-Import gebündelt, daher braucht es hier keinen separaten
       CDN-Link mehr. -->
</svelte:head>

<section class="travel" aria-labelledby="travel-title">
  <header class="travel__intro">
    <div>
      <p class="travel__eyebrow">Chile Toolkit</p>
      <h1 id="travel-title">{data.experience?.title ?? 'Chile Reiseplaner'}</h1>
      <p>{data.experience?.description ?? 'Wähle eine Route und entdecke alle Etappen im Detail.'}</p>
    </div>
  </header>

  <div class="travel__layout">
    {#if isMapFullscreen}
      <div class="travel__map-backdrop" role="presentation" aria-hidden="true" on:click={closeMapFullscreen}></div>
    {/if}
    <div class={`travel__map${isMapFullscreen ? ' travel__map--fullscreen' : ''}`} aria-live="polite">
      <div class="travel__map-controls" role="toolbar" aria-label="Karteneinstellungen">
        <button
          type="button"
          class="travel__map-control"
          title={isLegendVisible ? 'Legende ausblenden' : 'Legende anzeigen'}
          aria-pressed={isLegendVisible}
          on:click={toggleLegendVisibility}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path
              d="M5 6h14M5 12h9M5 18h14"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
          <span class="travel__sr-only">{isLegendVisible ? 'Legende ausblenden' : 'Legende anzeigen'}</span>
        </button>
        <button
          type="button"
          class="travel__map-control"
          title={isMapFullscreen ? 'Vollbild verlassen' : 'Karte im Vollbild anzeigen'}
          aria-pressed={isMapFullscreen}
          on:click={toggleMapFullscreen}
        >
          {#if isMapFullscreen}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M9 9H5V5M15 9h4V5M9 15H5v4m10 0h4v-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {:else}
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path
                d="M15 5h4v4M9 5H5v4m0 10v-4h4m10 4v-4h-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          {/if}
          <span class="travel__sr-only">{isMapFullscreen ? 'Vollbild schließen' : 'Karte im Vollbild anzeigen'}</span>
        </button>
      </div>
      <div
        id="travel-map"
        bind:this={mapContainer}
        role="application"
        aria-label="Interaktive Karte von Chile"
      ></div>
      {#if loadError}
        <p class="travel__map-error">{loadError}</p>
      {/if}
      {#if sliderSteps.length > 0}
        <div class="travel__map-slider" role="group" aria-label="Zeitverlauf">
          <div class="travel__map-slider-head">
            <label for="travel-map-slider">Zeitverlauf</label>
            <span>Schritt {sliderValue + 1} von {sliderSteps.length}</span>
          </div>
          <input
            id="travel-map-slider"
            type="range"
            min="0"
            max={sliderMax}
            step="1"
            bind:value={sliderValue}
            aria-valuetext={sliderLabel}
          />
          <div class="travel__map-slider-label">
            <strong>{sliderLabel}</strong>
            {#if sliderSteps[sliderValue]?.description}
              <span>{sliderSteps[sliderValue]?.description}</span>
            {/if}
          </div>
        </div>
      {/if}
      {#if isLegendVisible}
        <ul class="travel__legend" aria-label="Legende">
          {#each Object.entries(data.travel.transportModes) as [modeKey, mode]}
            <li>
              <span style={`--legend-color: ${mode.color}`}>{mode.icon ?? ''}</span>
              <div>
                <strong>{mode.label}</strong>
                {#if mode.description}
                  <p>{mode.description}</p>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <aside class="travel__routes" aria-label="Routen auswählen">
      <h2>Routenübersicht</h2>
      <p class="travel__routes-hint">
        Jede Option enthält Entfernungen, Transport und Unterkünfte für jeden Halt.
      </p>
      <ul>
        {#each data.travel.routeIndex as entry}
          <li>
            <button
              type="button"
              class:selected={entry.id === selectedRouteId}
              style={`--route-color: ${entry.color ?? '#2563eb'}`}
              on:click={() => selectRoute(entry.id)}
            >
              <span class="travel__route-name">{entry.name}</span>
              <span class="travel__route-meta">
                {entry.meta?.durationDays ?? selectedRoute?.meta?.durationDays ?? data.travel.meta.defaultDurationDays} Tage ·
                {entry.metrics?.totalDistanceKm ? `${numberFormatter.format(entry.metrics.totalDistanceKm)} km` : 'flexibel'}
              </span>
              <span class="travel__route-tagline">{entry.summary}</span>
              {#if entry.tags?.length}
                <span class="travel__route-tags">
                  {#each entry.tags as tag}
                    <span>{tag}</span>
                  {/each}
                </span>
              {/if}
            </button>
          </li>
        {/each}
      </ul>
    </aside>
  </div>

  {#if selectedRoute}
    <article class="travel__detail" aria-labelledby="route-title">
      <header class="travel__detail-header">
        <div>
          <h2 id="route-title">{selectedRoute.name}</h2>
          {#if selectedRoute.summary}
            <p>{selectedRoute.summary}</p>
          {/if}
        </div>
        <dl class="travel__metrics">
          {#if selectedRoute.meta?.durationDays}
            <div>
              <dt>Reisedauer</dt>
              <dd>{selectedRoute.meta.durationDays} Tage</dd>
            </div>
          {/if}
          {#if selectedRoute.metrics?.totalDistanceKm}
            <div>
              <dt>Gesamtdistanz</dt>
              <dd>{numberFormatter.format(selectedRoute.metrics.totalDistanceKm)} km</dd>
            </div>
          {/if}
          {#if selectedRoute.meta?.pace}
            <div>
              <dt>Tempo</dt>
              <dd>{selectedRoute.meta.pace}</dd>
            </div>
          {/if}
          {#if selectedRoute.meta?.costEstimate}
            <div>
              <dt>Budget (p. P.)</dt>
              <dd>{formatCurrency(selectedRoute.meta.costEstimate)}</dd>
            </div>
          {/if}
        </dl>
      </header>

      <div class="travel__spoilers">
        <details class="travel__spoiler" open>
          <summary>Highlights & Kennzahlen</summary>
          <div class="travel__spoiler-content">
            {#if selectedRoute.meta?.highlights?.length}
              <div class="travel__highlight-list">
                <h3>Highlights</h3>
                <ul>
                  {#each selectedRoute.meta.highlights as highlight}
                    <li>{highlight}</li>
                  {/each}
                </ul>
              </div>
            {/if}
            {#if selectedRoute.metrics}
              <div class="travel__metric-grid">
                {#if selectedRoute.metrics.segmentCount}
                  <div>
                    <span class="travel__metric-value">{selectedRoute.metrics.segmentCount}</span>
                    <span class="travel__metric-label">Segmente</span>
                  </div>
                {/if}
                {#if selectedRoute.metrics.flightCount}
                  <div>
                    <span class="travel__metric-value">{selectedRoute.metrics.flightCount}</span>
                    <span class="travel__metric-label">Flüge</span>
                  </div>
                {/if}
                {#if selectedRoute.metrics.lodgingCount}
                  <div>
                    <span class="travel__metric-value">{selectedRoute.metrics.lodgingCount}</span>
                    <span class="travel__metric-label">Unterkünfte</span>
                  </div>
                {/if}
                {#if selectedRoute.metrics.foodCount}
                  <div>
                    <span class="travel__metric-value">{selectedRoute.metrics.foodCount}</span>
                    <span class="travel__metric-label">Kulinarische Tipps</span>
                  </div>
                {/if}
                {#if selectedRoute.metrics.activityCount}
                  <div>
                    <span class="travel__metric-value">{selectedRoute.metrics.activityCount}</span>
                    <span class="travel__metric-label">Aktivitäten</span>
                  </div>
                {/if}
                {#if selectedRoute.metrics.estimatedCarbonKg}
                  <div>
                    <span class="travel__metric-value">{numberFormatter.format(selectedRoute.metrics.estimatedCarbonKg)} kg</span>
                    <span class="travel__metric-label">CO₂ gesamt</span>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </details>

        {#if sliderSteps.length > 0}
          <details class="travel__spoiler" open>
            <summary>Zeitverlauf & Slider</summary>
            <div class="travel__spoiler-content">
              <p>Bewege den Slider auf der Karte, um die Segmente dieser Liste schrittweise sichtbar zu machen.</p>
              <ol class="travel__timeline">
                {#each sliderSteps as step, index}
                  <li class:selected={index <= sliderValue}>
                    <span class="travel__timeline-index">{index + 1}</span>
                    <div>
                      <h4>{step.label}</h4>
                      {#if step.description}
                        <p>{step.description}</p>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ol>
            </div>
          </details>
        {/if}

        {#if selectedRoute.stops?.length}
          <details class="travel__spoiler" open>
            <summary>Stationen & Stopps</summary>
            <div class="travel__spoiler-content">
              <ol class="travel__stops-list">
                {#each selectedRoute.stops as stop, index}
                  <li>
                    <header>
                      <span class="travel__stop-index">{index + 1}</span>
                      <div>
                        <p class="travel__stop-day">{stop.city ?? stop.type ?? 'Station'}</p>
                        <h4>{stop.name}</h4>
                      </div>
                    </header>
                    {#if stop.description}
                      <p>{stop.description}</p>
                    {/if}
                    <dl class="travel__stop-meta">
                      {#if stop.timezone}
                        <div>
                          <dt>Zeitzone</dt>
                          <dd>{stop.timezone}</dd>
                        </div>
                      {/if}
                      {#if stop.rating}
                        <div>
                          <dt>Bewertung</dt>
                          <dd>{decimalFormatter.format(stop.rating)} · {stop.reviewCount ?? 0} Stimmen</dd>
                        </div>
                      {/if}
                      {#if stop.address?.city}
                        <div>
                          <dt>Adresse</dt>
                          <dd>{stop.address.street ?? ''} {stop.address.city ?? ''}</dd>
                        </div>
                      {/if}
                      {#if stop.website}
                        <div>
                          <dt>Website</dt>
                          <dd><a href={stop.website} target="_blank" rel="noopener">{stop.website}</a></dd>
                        </div>
                      {/if}
                    </dl>
                    {#if stop.photos?.length}
                      <div class="travel__image-grid">
                        {#each stop.photos as photo}
                          <figure>
                            <img src={photo.url} alt={photo.caption ?? stop.name} loading="lazy" />
                            {#if photo.caption}
                              <figcaption>{photo.caption}</figcaption>
                            {/if}
                          </figure>
                        {/each}
                      </div>
                    {/if}
                  </li>
                {/each}
              </ol>
            </div>
          </details>
        {/if}

        {#if selectedRoute.segments?.length}
          <details class="travel__spoiler">
            <summary>Transporte & Segmente</summary>
            <div class="travel__spoiler-content">
              <table class="travel__segments-table">
                <thead>
                  <tr>
                    <th>Modus</th>
                    <th>Von → Nach</th>
                    <th>Distanz</th>
                    <th>Dauer</th>
                    <th>CO₂</th>
                    <th>Betreiber</th>
                  </tr>
                </thead>
                <tbody>
                  {#each selectedRoute.segments as segment}
                    <tr>
                      <td>
                        <span class="travel__mode-chip" style={`--mode-color: ${resolveModeAppearance(segment.mode).color}`}>
                          {data.travel.transportModes[segment.mode]?.icon ?? ''}
                          {resolveModeAppearance(segment.mode).label}
                        </span>
                      </td>
                      <td>
                        {segment.from} → {segment.to}
                      </td>
                      <td>{segment.distanceKm ? `${numberFormatter.format(segment.distanceKm)} km` : '–'}</td>
                      <td>{segment.durationHours ? `${decimalFormatter.format(segment.durationHours)} h` : '–'}</td>
                      <td>{segment.carbonKg ? `${numberFormatter.format(segment.carbonKg)} kg` : '–'}</td>
                      <td>{segment.operator ?? '–'}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </details>
        {/if}

        {#if selectedRoute.flights?.length}
          <details class="travel__spoiler">
            <summary>Flüge</summary>
            <div class="travel__spoiler-content">
              <table class="travel__segments-table">
                <thead>
                  <tr>
                    <th>Verbindung</th>
                    <th>Airline</th>
                    <th>Dauer</th>
                    <th>Preis</th>
                    <th>CO₂</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {#each selectedRoute.flights as flight}
                    <tr>
                      <td>{flight.fromStopId} → {flight.toStopId}</td>
                      <td>{flight.airline ?? '–'}</td>
                      <td>{flight.durationHours ? `${decimalFormatter.format(flight.durationHours)} h` : '–'}</td>
                      <td>{formatCurrency(flight.price)}</td>
                      <td>{flight.carbonKg ? `${numberFormatter.format(flight.carbonKg)} kg` : '–'}</td>
                      <td>
                        <ul class="travel__data-list">
                          {#if flight.aircraft}
                            <li>Flugzeug: {flight.aircraft}</li>
                          {/if}
                          {#if flight.cabinClass}
                            <li>Reiseklasse: {flight.cabinClass}</li>
                          {/if}
                          {#if flight.baggage}
                            <li>Gepäck: {flight.baggage}</li>
                          {/if}
                        </ul>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </details>
        {/if}

        {#if selectedRoute.lodging?.length}
          <details class="travel__spoiler">
            <summary>Unterkünfte</summary>
            <div class="travel__spoiler-content">
              <ul class="travel__lodging-list">
                {#each selectedRoute.lodging as stay}
                  <li>
                    <h4>{stay.name}</h4>
                    <p class="travel__lodging-meta">
                      {stay.city ?? 'Chile'} · {stay.nights ?? 0} Nächte · {stay.pricePerNight ? `${formatCurrency(stay.pricePerNight)} pro Nacht` : 'Preis auf Anfrage'}
                    </p>
                    {#if stay.description}
                      <p>{stay.description}</p>
                    {/if}
                    {#if stay.amenities?.length}
                      <ul class="travel__pill-list">
                        {#each stay.amenities as amenity}
                          <li>{amenity}</li>
                        {/each}
                      </ul>
                    {/if}
                    {#if stay.url}
                      <p><a href={stay.url} target="_blank" rel="noopener">Zur Unterkunft</a></p>
                    {/if}
                    {#if stay.images?.length}
                      <div class="travel__image-grid">
                        {#each stay.images as image}
                          <figure>
                            <img src={image.url} alt={image.caption ?? stay.name} loading="lazy" />
                            {#if image.caption}
                              <figcaption>{image.caption}</figcaption>
                            {/if}
                          </figure>
                        {/each}
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          </details>
        {/if}

        {#if selectedRoute.food?.length}
          <details class="travel__spoiler">
            <summary>Kulinarik</summary>
            <div class="travel__spoiler-content">
              <ul class="travel__food-list">
                {#each selectedRoute.food as spot}
                  <li>
                    <h4>{spot.name}</h4>
                    <p class="travel__food-meta">{spot.city ?? 'Chile'} · {spot.priceRange ?? 'Preis variiert'}</p>
                    {#if spot.description}
                      <p>{spot.description}</p>
                    {/if}
                    {#if spot.mustTry?.length}
                      <ul class="travel__pill-list">
                        {#each spot.mustTry as item}
                          <li>{item}</li>
                        {/each}
                      </ul>
                    {/if}
                    {#if spot.images?.length}
                      <div class="travel__image-grid">
                        {#each spot.images as image}
                          <figure>
                            <img src={image.url} alt={image.caption ?? spot.name} loading="lazy" />
                            {#if image.caption}
                              <figcaption>{image.caption}</figcaption>
                            {/if}
                          </figure>
                        {/each}
                      </div>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          </details>
        {/if}

        {#if selectedRoute.activities?.length}
          <details class="travel__spoiler">
            <summary>Aktivitäten</summary>
            <div class="travel__spoiler-content">
              <ul class="travel__activity-list">
                {#each selectedRoute.activities as activity}
                  <li>
                    <h4>{activity.title ?? activity.name}</h4>
                    <p class="travel__activity-meta">
                      {activity.location ?? activity.stopId ?? 'Unterwegs'} ·
                      {activity.durationHours ? `${decimalFormatter.format(activity.durationHours)} h` : 'flexibel'} ·
                      {activity.difficulty ?? 'alle Levels'}
                    </p>
                    {#if activity.description}
                      <p>{activity.description}</p>
                    {/if}
                    {#if activity.price}
                      <p>Kosten: {formatCurrency(activity.price)}</p>
                    {/if}
                    {#if activity.website}
                      <p><a href={activity.website} target="_blank" rel="noopener">Zur Aktivität</a></p>
                    {/if}
                    {#if activity.images?.length}
                      <div class="travel__image-grid">
                        {#each activity.images as image}
                          <figure>
                            <img src={image.url} alt={image.caption ?? activity.title ?? activity.name} loading="lazy" />
                            {#if image.caption}
                              <figcaption>{image.caption}</figcaption>
                            {/if}
                          </figure>
                        {/each}
                      </div>
                    {/if}
                    {#if activity.restaurants?.length}
                      <details class="travel__mini-details">
                        <summary>Restaurantempfehlungen</summary>
                        <ul class="travel__restaurant-list">
                          {#each activity.restaurants as restaurant}
                            <li>
                              <strong>{restaurant.name}</strong>
                              {#if restaurant.images?.length}
                                <div class="travel__image-grid">
                                  {#each restaurant.images as image}
                                    <figure>
                                      <img src={image.url} alt={image.caption ?? restaurant.name} loading="lazy" />
                                      {#if image.caption}
                                        <figcaption>{image.caption}</figcaption>
                                      {/if}
                                    </figure>
                                  {/each}
                                </div>
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          </details>
        {/if}

        {#if selectedRoute.days?.length}
          <details class="travel__spoiler">
            <summary>Tagesdetails (Slider-Route)</summary>
            <div class="travel__spoiler-content">
              <ol class="travel__days-list">
                {#each selectedRoute.days as day, index}
                  <li>
                    <header>
                      <span class="travel__timeline-index">{index + 1}</span>
                      <div>
                        <h4>{day.station?.name ?? `Tag ${index + 1}`}</h4>
                        {#if day.date}
                          <p>{formatDate(day.date)}</p>
                        {/if}
                      </div>
                    </header>
                    {#if day.station?.description}
                      <p>{day.station.description}</p>
                    {/if}
                    {#if day.arrival?.segments?.length}
                      <details class="travel__mini-details" open>
                        <summary>Anreise & Transfers</summary>
                        <ul class="travel__data-list">
                          {#each day.arrival.segments as segment}
                            <li>
                              <strong>{resolveModeAppearance(segment.mode ?? '').label}</strong>
                              <div>
                                {segment.from?.name ?? 'Start'} → {segment.to?.name ?? 'Ziel'} ·
                                {segment.distanceKm ? `${numberFormatter.format(segment.distanceKm)} km` : 'Distanz offen'} ·
                                {segment.durationMinutes ? `${segment.durationMinutes} Minuten` : 'Zeit flexibel'}
                              </div>
                              {#if segment.description}
                                <p>{segment.description}</p>
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                    {#if day.activities?.length}
                      <details class="travel__mini-details" open>
                        <summary>Aktivitäten des Tages</summary>
                        <ul class="travel__data-list">
                          {#each day.activities as activity}
                            <li>
                              <strong>{activity.name}</strong>
                              {#if activity.description}
                                <p>{activity.description}</p>
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                    {#if day.hotels?.length}
                      <details class="travel__mini-details">
                        <summary>Hoteloptionen</summary>
                        <ul class="travel__data-list">
                          {#each day.hotels as hotel}
                            <li>
                              <strong>{hotel.name}</strong>
                              <div>{hotel.city ?? ''} · {hotel.pricePerNight ? `${formatCurrency(hotel.pricePerNight)} pro Nacht` : 'Preis auf Anfrage'}</div>
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                    {#if day.mobilityOptions}
                      <details class="travel__mini-details">
                        <summary>Weiterreise</summary>
                        <ul class="travel__data-list">
                          {#if day.mobilityOptions.nextFlight}
                            <li>
                              <strong>Nächster Flug</strong>
                              <div>{mobilitySummary(day.mobilityOptions.nextFlight)}</div>
                            </li>
                          {/if}
                          {#if day.mobilityOptions.nextBus}
                            <li>
                              <strong>Nächster Bus</strong>
                              <div>{mobilitySummary(day.mobilityOptions.nextBus)}</div>
                            </li>
                          {/if}
                          {#if day.mobilityOptions.nextDrive}
                            <li>
                              <strong>Nächster Roadtrip</strong>
                              <div>{mobilitySummary(day.mobilityOptions.nextDrive)}</div>
                            </li>
                          {/if}
                        </ul>
                      </details>
                    {/if}
                  </li>
                {/each}
              </ol>
            </div>
          </details>
        {/if}

        {#if selectedRoute.costBreakdown?.length}
          <details class="travel__spoiler">
            <summary>Kostenübersicht</summary>
            <div class="travel__spoiler-content">
              <ul class="travel__cost-list">
                {#each selectedRoute.costBreakdown as entry}
                  <li>
                    <strong>{entry.category}</strong>
                    <span>{formatCurrency(entry.amount)} {entry.currency ?? data.travel.meta.currency ?? 'EUR'}</span>
                    {#if entry.description}
                      <p>{entry.description}</p>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          </details>
        {/if}

        {#if selectedRoute.notes}
          <details class="travel__spoiler">
            <summary>Hinweise</summary>
            <div class="travel__spoiler-content">
              <p>{selectedRoute.notes}</p>
            </div>
          </details>
        {/if}
      </div>
    </article>
  {:else}
    <p class="travel__empty">Wähle eine Route aus, um Details zu sehen.</p>
  {/if}
</section>

<style>
  :global(body.travel-body) {
    background: #0f172a;
  }

  :global(body.travel-map-fullscreen-open) {
    overflow: hidden;
  }

  .travel {
    display: flex;
    flex-direction: column;
    gap: 3rem;
    padding: clamp(1.5rem, 2vw + 1rem, 3rem) clamp(1rem, 2vw + 1rem, 3.5rem) 4rem;
    color: #0f172a;
    background: linear-gradient(180deg, #eef2ff 0%, #f8fafc 35%, #ffffff 100%);
  }

  .travel__intro h1 {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .travel__intro p {
    max-width: 48rem;
    color: #334155;
  }

  .travel__eyebrow {
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-size: 0.75rem;
    color: #6366f1;
    margin-bottom: 0.5rem;
  }

  .travel__layout {
    display: grid;
    gap: 2rem;
    grid-template-columns: minmax(0, 2fr) minmax(18rem, 1fr);
    align-items: start;
  }

  .travel__map {
    position: relative;
    border-radius: 1.25rem;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
    background: #fff;
    min-height: clamp(240px, 32vh, 420px);
    transition: box-shadow 200ms ease;
    z-index: 1;
    display: flex;
    flex-direction: column;
  }

  .travel__map-controls {
    position: absolute;
    top: max(1rem, env(safe-area-inset-top));
    left: max(1rem, env(safe-area-inset-left));
    display: flex;
    gap: 0.5rem;
    z-index: 5;
  }

  .travel__map-control {
    width: 2.75rem;
    height: 2.75rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(15, 23, 42, 0.82);
    color: white;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 14px 32px rgba(15, 23, 42, 0.25);
    cursor: pointer;
    transition: transform 160ms ease, background 160ms ease, box-shadow 160ms ease;
  }

  .travel__map-control:hover,
  .travel__map-control:focus-visible {
    background: rgba(59, 130, 246, 0.92);
    transform: translateY(-1px);
    outline: none;
    box-shadow: 0 18px 40px rgba(37, 99, 235, 0.35);
  }

  .travel__map-control svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  #travel-map {
    width: 100%;
    flex: 1 1 auto;
    min-height: clamp(240px, 32vh, 420px);
  }

  .travel__map-slider {
    padding: 1rem 1.5rem 1.25rem;
    background: rgba(15, 23, 42, 0.85);
    color: #f8fafc;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__map-slider input[type='range'] {
    width: 100%;
    accent-color: #6366f1;
  }

  .travel__map-slider-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .travel__map-slider-label {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.875rem;
  }

  .travel__map-slider-label strong {
    font-size: 1rem;
  }

  .travel__map--fullscreen {
    position: fixed;
    inset: 0;
    border-radius: 0;
    width: 100vw;
    height: 100dvh;
    min-height: 100dvh;
    box-shadow: none;
    background: #0f172a;
    z-index: 60;
  }

  .travel__map--fullscreen #travel-map {
    min-height: 100dvh;
  }

  .travel__map-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.65);
    backdrop-filter: blur(2px);
    z-index: 50;
    cursor: pointer;
  }

  :global(.maplibregl-canvas) {
    outline: none;
  }

  :global(.maplibregl-ctrl-top-right),
  :global(.maplibregl-ctrl-bottom-right) {
    margin: 12px;
  }

  :global(.maplibregl-popup.travel-map-popup .maplibregl-popup-content) {
    background: rgba(15, 23, 42, 0.92);
    color: #f8fafc;
    border-radius: 0.75rem;
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.35);
    font-size: 0.85rem;
    line-height: 1.35;
    padding: 0.85rem 1rem;
  }

  :global(.maplibregl-popup.travel-map-popup .maplibregl-popup-tip) {
    border-top-color: rgba(15, 23, 42, 0.92);
  }

  :global(.maplibregl-popup-close-button) {
    display: none;
  }

  .travel__map-error {
    position: absolute;
    inset: 1rem;
    background: rgba(255, 255, 255, 0.9);
    padding: 1rem;
    border-radius: 0.75rem;
    color: #b91c1c;
    font-weight: 600;
  }

  .travel__legend {
    position: absolute;
    inset: auto max(1rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) auto;
    list-style: none;
    margin: 0;
    padding: 0.9rem 1.1rem;
    background: rgba(15, 23, 42, 0.85);
    color: white;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    font-size: 0.875rem;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 4;
  }

  .travel__legend li {
    display: flex;
    align-items: flex-start;
    gap: 0.6rem;
  }

  .travel__legend li span:first-child {
    display: inline-flex;
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    background: var(--legend-color);
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .travel__routes {
    background: rgba(15, 23, 42, 0.04);
    border-radius: 1.25rem;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .travel__routes h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .travel__routes ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__routes button {
    width: 100%;
    text-align: left;
    border: 1px solid rgba(15, 23, 42, 0.12);
    border-radius: 1rem;
    padding: 1rem 1.25rem;
    background: white;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .travel__routes button:hover,
  .travel__routes button:focus-visible {
    border-color: var(--route-color);
    box-shadow: 0 14px 30px rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
    outline: none;
  }

  .travel__routes button.selected {
    border-color: var(--route-color);
    box-shadow: 0 20px 40px rgba(99, 102, 241, 0.18);
  }

  .travel__route-name {
    font-weight: 600;
    font-size: 1.05rem;
  }

  .travel__route-meta {
    font-size: 0.875rem;
    color: #475569;
  }

  .travel__route-tagline {
    font-size: 0.85rem;
    color: #1e293b;
  }

  .travel__route-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .travel__route-tags span {
    background: rgba(99, 102, 241, 0.12);
    color: #4338ca;
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .travel__detail {
    background: white;
    border-radius: 1.25rem;
    box-shadow: 0 24px 64px rgba(15, 23, 42, 0.14);
    padding: clamp(1.5rem, 2vw + 1rem, 2.5rem);
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .travel__detail-header {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    justify-content: space-between;
  }

  .travel__detail-header h2 {
    font-size: clamp(1.5rem, 2.5vw, 2.25rem);
    margin-bottom: 0.3rem;
  }

  .travel__detail-header p {
    max-width: 48rem;
    color: #475569;
  }

  .travel__metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 1rem;
    margin: 0;
  }

  .travel__metrics div {
    background: rgba(99, 102, 241, 0.08);
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .travel__metrics dt {
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6366f1;
    margin-bottom: 0.3rem;
  }

  .travel__metrics dd {
    margin: 0;
    font-weight: 600;
    color: #1e293b;
  }

  .travel__spoilers {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .travel__spoiler {
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 1rem;
    background: rgba(248, 250, 252, 0.9);
    overflow: hidden;
  }

  .travel__spoiler summary {
    list-style: none;
    cursor: pointer;
    padding: 0.9rem 1.25rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .travel__spoiler summary::-webkit-details-marker {
    display: none;
  }

  .travel__spoiler[open] > summary {
    color: #2563eb;
  }

  .travel__spoiler-content {
    padding: 0 1.25rem 1.4rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    color: #1f2937;
  }

  .travel__highlight-list ul,
  .travel__data-list,
  .travel__restaurant-list,
  .travel__cost-list {
    margin: 0;
    padding-left: 1.1rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .travel__metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
    gap: 0.75rem;
  }

  .travel__metric-grid div {
    background: white;
    border-radius: 0.75rem;
    padding: 0.9rem;
    box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.08);
    text-align: center;
  }

  .travel__metric-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #2563eb;
  }

  .travel__metric-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #475569;
  }

  .travel__timeline {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__timeline li {
    display: flex;
    gap: 0.85rem;
    align-items: flex-start;
    background: white;
    border-radius: 0.85rem;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(99, 102, 241, 0.08);
  }

  .travel__timeline li.selected {
    border-color: rgba(99, 102, 241, 0.45);
    box-shadow: 0 12px 30px rgba(99, 102, 241, 0.1);
  }

  .travel__timeline-index {
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    background: rgba(99, 102, 241, 0.15);
    color: #4338ca;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .travel__stops-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .travel__stops-list li {
    background: white;
    border-radius: 1rem;
    padding: 1rem 1.2rem;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__stops-list header {
    display: flex;
    gap: 0.85rem;
    align-items: center;
  }

  .travel__stop-index {
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 999px;
    background: rgba(37, 99, 235, 0.1);
    color: #1d4ed8;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .travel__stop-day {
    font-size: 0.85rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #6366f1;
    margin: 0 0 0.15rem;
  }

  .travel__stop-meta {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    margin: 0;
  }

  .travel__stop-meta dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
  }

  .travel__stop-meta dd {
    margin: 0.2rem 0 0;
    font-weight: 600;
  }

  .travel__image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.75rem;
  }

  .travel__image-grid img {
    width: 100%;
    height: 120px;
    object-fit: cover;
    border-radius: 0.75rem;
  }

  .travel__image-grid figcaption {
    font-size: 0.75rem;
    color: #475569;
    margin-top: 0.2rem;
  }

  .travel__segments-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .travel__segments-table th {
    text-align: left;
    color: #475569;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding-bottom: 0.5rem;
  }

  .travel__segments-table td {
    padding: 0.6rem 0;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
    vertical-align: top;
  }

  .travel__mode-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: rgba(99, 102, 241, 0.12);
    color: #1d4ed8;
    padding: 0.25rem 0.65rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .travel__data-list li {
    list-style: disc;
  }

  .travel__pill-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .travel__pill-list li {
    background: rgba(15, 23, 42, 0.08);
    border-radius: 999px;
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #1e293b;
  }

  .travel__lodging-list,
  .travel__food-list,
  .travel__activity-list,
  .travel__days-list,
  .travel__cost-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .travel__lodging-meta,
  .travel__food-meta,
  .travel__activity-meta {
    font-size: 0.85rem;
    color: #475569;
  }

  .travel__mini-details {
    background: rgba(15, 23, 42, 0.05);
    border-radius: 0.75rem;
    padding: 0.75rem 0.9rem;
  }

  .travel__mini-details summary {
    cursor: pointer;
    font-weight: 600;
    margin-bottom: 0.4rem;
  }

  .travel__mini-details summary::-webkit-details-marker {
    display: none;
  }

  .travel__restaurant-list {
    gap: 0.8rem;
  }

  .travel__cost-list li {
    background: white;
    border-radius: 0.75rem;
    padding: 0.8rem 1rem;
    box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .travel__empty {
    font-size: 1.1rem;
    color: #475569;
  }

  .travel__sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  @media (max-width: 1100px) {
    .travel__layout {
      grid-template-columns: 1fr;
    }

    .travel__routes {
      order: -1;
    }
  }

  @media (max-width: 720px) {
    .travel {
      padding: 1.25rem 1rem 2.5rem;
    }

    .travel__map {
      border-radius: 1rem;
    }

    .travel__map-slider {
      padding: 0.85rem 1rem 1.1rem;
    }

    .travel__detail {
      padding: 1.25rem;
    }

    .travel__legend {
      position: static;
      margin: 1rem;
      border-radius: 1rem;
    }
  }
</style>
