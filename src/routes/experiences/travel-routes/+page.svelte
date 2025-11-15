<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { PageData } from './$types';
  import type { TravelRoute } from '../../../lib/data/chile-travel';
  import type { FeatureCollection, Geometry } from 'geojson';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { calculateBoundingBox, collectRouteCoordinates } from '../../../lib/travel/map-bounds';

  type MapLibreModule = typeof import('maplibre-gl');
  type MapLibreMap = import('maplibre-gl').Map;
  type MapLayerMouseEvent = import('maplibre-gl').MapLayerMouseEvent;
  type Popup = import('maplibre-gl').Popup;
  type GeoJSONSource = import('maplibre-gl').GeoJSONSource;
  type StyleSpecification = import('maplibre-gl').StyleSpecification;

  export let data: PageData;

  // Für Einsteiger:innen: Wir speichern nur die ID der aktiven Route, damit das UI
  // leicht nachvollziehbar bleibt. Über den abgeleiteten Wert greifen wir immer auf
  // die vollständigen Routeninformationen zu.
  let selectedRouteId = data.travel.routes[0]?.id ?? '';
  let selectedRoute: TravelRoute | undefined = data.travel.routes.find((route) => route.id === selectedRouteId);

  let mapContainer: HTMLDivElement | null = null;
  let mapInstance: MapLibreMap | null = null;
  let maplibre: MapLibreModule | null = null;
  let mapLoaded = false;
  let loadError: string | null = null;
  let resizeCleanup: (() => void) | null = null;
  let activePopup: Popup | null = null;
  let isMapFullscreen = false;
  let isLegendVisible = true;

  const ROUTE_LINE_SOURCE = 'travel-route-line';
  const ROUTE_LINE_LAYER = 'travel-route-line-layer';
  const ROUTE_STOP_SOURCE = 'travel-route-stops';
  const ROUTE_STOP_LAYER = 'travel-route-stops-layer';
  const ROUTE_STOP_LABEL_LAYER = 'travel-route-stop-label-layer';
  const STOP_POPUP_CLASS = 'travel-map-popup';
  const FULLSCREEN_BODY_CLASS = 'travel-map-fullscreen-open';

  // Für Einsteiger:innen: Diese kleine Hilfsfunktion sorgt dafür, dass wir das
  // Scrollen der Seite deaktivieren können, sobald die Karte im Vollbildmodus
  // geöffnet wird. Auf Mobilgeräten verhindert das, dass die Seite "wegrutscht".
  function setBodyScrollLock(shouldLock: boolean) {
    if (typeof document === 'undefined') return;
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

  async function toggleMapFullscreen() {
    isMapFullscreen = !isMapFullscreen;
    setBodyScrollLock(isMapFullscreen);
    updateScrollZoom(isMapFullscreen);
    await tick();

    if (mapLoaded && selectedRoute) {
      mapInstance?.resize();
      focusRoute(selectedRoute);
    }
  }

  function closeMapFullscreen() {
    if (!isMapFullscreen) return;
    void toggleMapFullscreen();
  }

  function toggleLegendVisibility() {
    isLegendVisible = !isLegendVisible;
  }

  function updateSelectedRoute() {
    selectedRoute = data.travel.routes.find((route) => route.id === selectedRouteId);
  }

  function addBodyTheme() {
    if (typeof document === 'undefined') return;
    document.body.classList.add('travel-body');
  }

  function removeBodyTheme() {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('travel-body');
  }

  async function ensureMapLibre(): Promise<MapLibreModule | null> {
    if (typeof window === 'undefined') return null;
    if (maplibre) return maplibre;

    const module = await import('maplibre-gl');
    maplibre = module;
    return maplibre;
  }

  function removeMapPopup() {
    if (activePopup) {
      activePopup.remove();
      activePopup = null;
    }
  }

  function createRasterStyle(): StyleSpecification {
    const tiles: string[] = [data.travel.map.tileUrl];
    return {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        osm: {
          type: 'raster',
          tiles,
          tileSize: 256,
          attribution: data.travel.map.attribution,
          maxzoom: data.travel.map.maxZoom ?? 12
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

  function createLineFeature(route: TravelRoute): FeatureCollection<Geometry, Record<string, unknown>> {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.mapPolyline
          },
          properties: {
            color: route.color,
            id: route.id,
            name: route.name
          }
        }
      ]
    };
  }

  function createStopCollection(route: TravelRoute): FeatureCollection<Geometry, Record<string, unknown>> {
    return {
      type: 'FeatureCollection',
      features: route.stops.map((stop, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: stop.coordinates
        },
        properties: {
          id: stop.id,
          index,
          label: `${index + 1}`,
          color: route.color,
          title: `${index + 1}. ${stop.location}`,
          subtitle: stop.dayRange
        }
      }))
    };
  }

  function setupSources(route: TravelRoute | undefined) {
    if (!mapInstance || !maplibre || !route) return;
    const lineData = createLineFeature(route);
    const stopData = createStopCollection(route);

    if (!mapInstance.getSource(ROUTE_LINE_SOURCE)) {
      mapInstance.addSource(ROUTE_LINE_SOURCE, {
        type: 'geojson',
        data: lineData
      });
      mapInstance.addLayer({
        id: ROUTE_LINE_LAYER,
        type: 'line',
        source: ROUTE_LINE_SOURCE,
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], '#2563eb'],
          'line-width': 4,
          'line-opacity': 0.94
        }
      });
    }

    if (!mapInstance.getSource(ROUTE_STOP_SOURCE)) {
      mapInstance.addSource(ROUTE_STOP_SOURCE, {
        type: 'geojson',
        data: stopData
      });
      mapInstance.addLayer({
        id: ROUTE_STOP_LAYER,
        type: 'circle',
        source: ROUTE_STOP_SOURCE,
        paint: {
          'circle-radius': 6,
          'circle-color': ['coalesce', ['get', 'color'], '#1e293b'],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
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

  function focusRoute(route: TravelRoute | undefined) {
    if (!mapInstance || !maplibre || !route) return;

    const coordinates = collectRouteCoordinates(route);
    if (coordinates.length === 0) return;

    const boundingBox = calculateBoundingBox(coordinates);
    if (!boundingBox) return;

    const bounds = new maplibre.LngLatBounds(boundingBox[0], boundingBox[1]);

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isNarrow = typeof window !== 'undefined' && window.innerWidth <= 720;
    const paddingValue = isNarrow ? data.travel.map.mobilePadding ?? 120 : 64;

    mapInstance.fitBounds(bounds, {
      padding: { top: 48, right: paddingValue, bottom: paddingValue + 24, left: paddingValue },
      duration: prefersReducedMotion ? 0 : 800,
      maxZoom: data.travel.map.maxZoom ?? 12
    });
  }

  function updateRouteOnMap(route: TravelRoute | undefined) {
    if (!mapInstance || !maplibre || !route) return;

    const lineSource = mapInstance.getSource(ROUTE_LINE_SOURCE) as GeoJSONSource | undefined;
    const stopSource = mapInstance.getSource(ROUTE_STOP_SOURCE) as GeoJSONSource | undefined;

    if (!lineSource || !stopSource) {
      setupSources(route);
      return updateRouteOnMap(route);
    }

    lineSource.setData(createLineFeature(route));
    stopSource.setData(createStopCollection(route));
    focusRoute(route);
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
      maxWidth: '220px',
      className: STOP_POPUP_CLASS
    })
      .setLngLat(coordinates)
      .setHTML(`<strong>${title}</strong><div>${subtitle}</div>`)
      .addTo(mapInstance);
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

        mapInstance = new module.Map({
          container: mapContainer,
          style: createRasterStyle(),
          center: data.travel.map.center,
          zoom: data.travel.map.zoom,
          maxZoom: data.travel.map.maxZoom ?? 12,
          attributionControl: false,
          scrollZoom: false
        });

        mapInstance.dragRotate.disable();
        mapInstance.touchZoomRotate.enable();
        mapInstance.touchZoomRotate.enableRotation();

        mapInstance.addControl(new module.NavigationControl({ showCompass: false }), 'top-right');
        mapInstance.addControl(new module.AttributionControl({ compact: true }));

        mapInstance.on('load', () => {
          if (cancelled) return;
          setupSources(selectedRoute);
          mapLoaded = true;
          updateRouteOnMap(selectedRoute);
        });

        mapInstance.on('click', ROUTE_STOP_LAYER, handleStopClick);
        mapInstance.on('mouseenter', ROUTE_STOP_LAYER, () => {
          if (mapInstance) {
            mapInstance.getCanvas().style.cursor = 'pointer';
          }
        });
        mapInstance.on('mouseleave', ROUTE_STOP_LAYER, () => {
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

  $: updateSelectedRoute();
  $: if (mapLoaded && selectedRoute) {
    removeMapPopup();
    updateRouteOnMap(selectedRoute);
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
      <!-- Für Einsteiger:innen: Die Toolbar bündelt alle Map-Aktionen. So können wir
           Vollbild und Legende einfach erweitern, ohne weitere Controls von
           MapLibre selbst einblenden zu müssen. -->
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
      {#if isLegendVisible}
        <ul class="travel__legend" aria-label="Legende">
          {#each data.travel.map.legend as legendItem}
            <li>
              <span style={`--legend-color: ${legendItem.color}`}></span>
              {legendItem.label}
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
        {#each data.travel.routes as route}
          <li>
            <button
              type="button"
              class:selected={route.id === selectedRouteId}
              style={`--route-color: ${route.color}`}
              on:click={() => {
                selectedRouteId = route.id;
              }}
            >
              <span class="travel__route-name">{route.name}</span>
              <span class="travel__route-meta">{route.totalDays} Tage · {route.totalDistanceKm} km</span>
              <span class="travel__route-tagline">{route.tagline}</span>
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
          <p>{selectedRoute.summary}</p>
        </div>
        <dl class="travel__metrics">
          <div>
            <dt>Reisedauer</dt>
            <dd>{selectedRoute.totalDays} Tage</dd>
          </div>
          <div>
            <dt>Gesamtdistanz</dt>
            <dd>{selectedRoute.totalDistanceKm.toLocaleString('de-DE')} km</dd>
          </div>
          <div>
            <dt>Tempo</dt>
            <dd>{selectedRoute.essentials.pace}</dd>
          </div>
        </dl>
      </header>

      <section class="travel__chips" aria-label="Fortbewegung">
        <h3>Fortbewegungsmix</h3>
        <ul>
          {#each selectedRoute.transportMix as mode}
            <li>{mode}</li>
          {/each}
        </ul>
      </section>

      <section class="travel__essentials" aria-label="Praktische Hinweise">
        <h3>Reisetipps auf einen Blick</h3>
        <dl>
          <div>
            <dt>Beste Reisezeit</dt>
            <dd>{selectedRoute.essentials.bestSeason}</dd>
          </div>
          <div>
            <dt>Budget (pro Person)</dt>
            <dd>{selectedRoute.essentials.budgetPerPersonEUR}</dd>
          </div>
          <div>
            <dt>Empfohlen für</dt>
            <dd>{selectedRoute.essentials.recommendedFor.join(', ')}</dd>
          </div>
        </dl>
      </section>

      <section class="travel__stops" aria-label="Etappenübersicht">
        <h3>Etappen & Aufenthalte</h3>
        <ol>
          {#each selectedRoute.stops as stop, index}
            <li>
              <header>
                <span class="travel__stop-index">{index + 1}</span>
                <div>
                  <p class="travel__stop-day">{stop.dayRange}</p>
                  <h4>{stop.location}</h4>
                </div>
              </header>
              <p>{stop.description}</p>
              <dl class="travel__stop-meta">
                <div>
                  <dt>Aufenthalt</dt>
                  <dd>{stop.stayNights} {stop.stayNights === 1 ? 'Nacht' : 'Nächte'}</dd>
                </div>
                <div>
                  <dt>Anreise</dt>
                  <dd>{stop.transportMode}</dd>
                </div>
                <div>
                  <dt>Strecke</dt>
                  <dd>{stop.travelDistanceKm.toLocaleString('de-DE')} km · {stop.travelDurationHours.toLocaleString('de-DE', { maximumFractionDigits: 1 })} h</dd>
                </div>
                <div>
                  <dt>Unterkunft</dt>
                  <dd>{stop.accommodation}</dd>
                </div>
              </dl>
              <div class="travel__stop-highlights">
                <h5>Highlights</h5>
                <ul>
                  {#each stop.highlights as highlight}
                    <li>{highlight}</li>
                  {/each}
                </ul>
              </div>
            </li>
          {/each}
        </ol>
      </section>
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
    height: clamp(220px, 30vh, 380px);
    min-height: clamp(220px, 30vh, 380px);
    transition: box-shadow 200ms ease;
    z-index: 1;
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
    height: 100%;
    min-height: clamp(220px, 30vh, 380px);
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
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.85);
    color: white;
    border-radius: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.875rem;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    z-index: 4;
  }

  .travel__legend li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .travel__legend span {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    background: var(--legend-color);
    display: inline-flex;
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

  .travel__routes {
    background: white;
    border-radius: 1.25rem;
    padding: 1.5rem;
    box-shadow: 0 20px 60px rgba(15, 23, 42, 0.15);
  }

  .travel__routes h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25rem;
  }

  .travel__routes-hint {
    margin: 0 0 1.5rem;
    color: #475569;
    font-size: 0.95rem;
  }

  .travel__routes ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__routes button {
    width: 100%;
    text-align: left;
    border: 1px solid transparent;
    border-radius: 1rem;
    padding: 1rem 1.25rem;
    background: #f8fafc;
    color: inherit;
    transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
    display: grid;
    gap: 0.35rem;
  }

  .travel__routes button:hover,
  .travel__routes button:focus-visible {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(79, 70, 229, 0.18);
    border-color: var(--route-color);
    outline: none;
  }

  .travel__routes button.selected {
    background: rgba(79, 70, 229, 0.08);
    border-color: var(--route-color);
    box-shadow: 0 14px 36px rgba(30, 64, 175, 0.18);
  }

  .travel__route-name {
    font-weight: 600;
    font-size: 1rem;
  }

  .travel__route-meta {
    font-size: 0.85rem;
    color: #475569;
  }

  .travel__route-tagline {
    font-size: 0.9rem;
    color: #1e293b;
  }

  .travel__detail {
    background: white;
    border-radius: 1.5rem;
    padding: clamp(1.5rem, 2vw + 1rem, 3rem);
    box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .travel__detail-header {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .travel__detail-header h2 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.4rem);
  }

  .travel__detail-header p {
    color: #334155;
    margin: 0;
  }

  .travel__metrics {
    display: grid;
    gap: 1rem;
    grid-template-columns: repeat(auto-fit, minmax(8rem, 1fr));
  }

  .travel__metrics dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
  }

  .travel__metrics dd {
    margin: 0;
    font-weight: 600;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .travel__chips {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__chips h3 {
    margin: 0;
  }

  .travel__chips ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .travel__chips li {
    background: #e0f2fe;
    color: #0c4a6e;
    padding: 0.4rem 0.8rem;
    border-radius: 999px;
    font-size: 0.9rem;
  }

  .travel__essentials dl {
    display: grid;
    gap: 1.25rem;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }

  .travel__essentials dt {
    font-size: 0.85rem;
    color: #64748b;
    margin-bottom: 0.35rem;
  }

  .travel__essentials dd {
    margin: 0;
    font-weight: 600;
    color: #0f172a;
  }

  .travel__stops ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 1.5rem;
  }

  .travel__stops li {
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(145deg, rgba(248, 250, 252, 0.95), rgba(224, 242, 254, 0.35));
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .travel__stops header {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .travel__stop-index {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;
    background: #2563eb;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
  }

  .travel__stop-day {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #64748b;
    margin: 0;
  }

  .travel__stops h4 {
    margin: 0;
  }

  .travel__stop-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
    margin: 1rem 0 0;
  }

  .travel__stop-meta dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #475569;
  }

  .travel__stop-meta dd {
    margin: 0;
    color: #0f172a;
    font-weight: 600;
  }

  .travel__stop-highlights {
    margin-top: 1rem;
  }

  .travel__stop-highlights h5 {
    margin: 0 0 0.5rem;
    font-size: 0.95rem;
  }

  .travel__stop-highlights ul {
    margin: 0;
    padding-left: 1.2rem;
    color: #1e293b;
  }

  .travel__empty {
    text-align: center;
    color: #475569;
    font-style: italic;
  }

  @media (max-width: 960px) {
    .travel__layout {
      grid-template-columns: 1fr;
    }

    .travel__map {
      height: clamp(220px, 30vh, 360px);
      min-height: clamp(220px, 30vh, 360px);
    }

    #travel-map {
      min-height: clamp(220px, 30vh, 360px);
    }
  }

  @media (max-width: 720px) {
    .travel {
      padding: clamp(1rem, 4vw, 2rem);
      gap: 2.5rem;
    }

    .travel__legend {
      position: static;
      margin: 0.75rem auto 0;
      flex-direction: row;
      justify-content: center;
      gap: 1rem;
    }

    .travel__routes {
      padding: 1.25rem;
    }

    .travel__routes ul {
      flex-direction: row;
      overflow-x: auto;
      gap: 0.75rem;
      scroll-snap-type: x proximity;
      padding-bottom: 0.5rem;
      scrollbar-width: thin;
    }

    .travel__routes li {
      flex: 0 0 min(85%, 280px);
      scroll-snap-align: start;
    }

    .travel__routes ul::-webkit-scrollbar {
      height: 6px;
    }

    .travel__routes ul::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.4);
      border-radius: 999px;
    }

    .travel__routes button {
      min-height: 9.5rem;
    }

    .travel__detail {
      padding: clamp(1.25rem, 4vw, 2rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .travel__routes button {
      transition: none;
    }

    .travel__routes button:hover,
    .travel__routes button:focus-visible {
      transform: none;
      box-shadow: 0 0 0 1px var(--route-color);
    }
  }
</style>
