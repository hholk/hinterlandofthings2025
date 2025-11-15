<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type { TravelRoute } from '../../../lib/data/chile-travel';

  export let data: PageData;

  // Für Einsteiger:innen: Wir speichern nur die ID der aktiven Route, damit das UI
  // leicht nachvollziehbar bleibt. Über den abgeleiteten Wert greifen wir immer auf
  // die vollständigen Routeninformationen zu.
  let selectedRouteId = data.travel.routes[0]?.id ?? '';
  let selectedRoute: TravelRoute | undefined = data.travel.routes.find((route) => route.id === selectedRouteId);

  let mapContainer: HTMLDivElement | null = null;
  let mapInstance: any = null;
  let leaflet: any = null;
  let markerLayer: any = null;
  let lineLayer: any = null;
  let loadError: string | null = null;

  const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

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

  // Für Einsteiger:innen: Diese Hilfsfunktion lädt Leaflet nur im Browser.
  async function ensureLeaflet(): Promise<any> {
    if (typeof window === 'undefined') return null;
    if (leaflet) return leaflet;

    if ((window as typeof window & { L?: unknown }).L) {
      leaflet = (window as typeof window & { L: any }).L;
      return leaflet;
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-leaflet]') as HTMLScriptElement | null;
      const script = existing ?? document.createElement('script');

      script.src = LEAFLET_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.leaflet = 'true';
      script.addEventListener('load', () => resolve(), { once: true });
      script.addEventListener('error', () => reject(new Error('Leaflet konnte nicht geladen werden.')));

      if (!existing) {
        document.head.appendChild(script);
      }
    });

    leaflet = (window as typeof window & { L: any }).L;
    return leaflet;
  }

  function renderRoute(route: TravelRoute | undefined) {
    if (!route || !leaflet || !mapInstance) return;

    if (markerLayer) {
      mapInstance.removeLayer(markerLayer);
      markerLayer = null;
    }
    if (lineLayer) {
      mapInstance.removeLayer(lineLayer);
      lineLayer = null;
    }

    lineLayer = leaflet.polyline(route.mapPolyline, {
      color: route.color,
      weight: 4,
      opacity: 0.95
    }).addTo(mapInstance);

    markerLayer = leaflet.layerGroup(
      route.stops.map((stop, index) =>
        leaflet
          .circleMarker(stop.coordinates, {
            radius: 6,
            weight: 2,
            color: route.color,
            fillColor: '#ffffff',
            fillOpacity: 1
          })
          .bindTooltip(`${index + 1}. ${stop.dayRange} – ${stop.location}`, { direction: 'top' })
      )
    ).addTo(mapInstance);

    try {
      const bounds = lineLayer.getBounds();
      mapInstance.fitBounds(bounds, { padding: [32, 32] });
    } catch (error) {
      console.warn('Konnte Bounds nicht setzen', error);
    }
  }

  onMount(() => {
    if (!mapContainer) return;

    let cancelled = false;

    const boot = async () => {
      try {
        const L = await ensureLeaflet();
        if (!L || cancelled) return;

        leaflet = L;
        mapInstance = L.map(mapContainer, {
          center: data.travel.map.center,
          zoom: data.travel.map.zoom,
          scrollWheelZoom: false
        });

        L.tileLayer(data.travel.map.tileUrl, {
          attribution: data.travel.map.attribution,
          maxZoom: 12
        }).addTo(mapInstance);

        renderRoute(selectedRoute);
      } catch (error) {
        loadError = error instanceof Error ? error.message : 'Unbekannter Fehler beim Laden der Karte';
      }
    };

    addBodyTheme();
    void boot();

    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
      markerLayer = null;
      lineLayer = null;
      removeBodyTheme();
    };
  });

  $: updateSelectedRoute();
  $: if (mapInstance && selectedRoute) {
    renderRoute(selectedRoute);
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
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha512-sA+e2PK0FG3blwYqCCptdJOwA/6R1/pnS1AZJgYzu3n6PvJEa3TBUnIFmLnb5DxF0E2SABOeHG3H0p+0bBt5JQ=="
    crossorigin=""
  />
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
    <div class="travel__map" aria-live="polite">
      <div
        id="travel-map"
        bind:this={mapContainer}
        role="application"
        aria-label="Interaktive Karte von Chile"
      ></div>
      {#if loadError}
        <p class="travel__map-error">{loadError}</p>
      {/if}
      <ul class="travel__legend" aria-label="Legende">
        {#each data.travel.map.legend as legendItem}
          <li>
            <span style={`--legend-color: ${legendItem.color}`}></span>
            {legendItem.label}
          </li>
        {/each}
      </ul>
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
    min-height: 420px;
  }

  #travel-map {
    width: 100%;
    height: 100%;
    min-height: 420px;
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
    inset: auto 1rem 1rem auto;
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
      min-height: 320px;
    }
  }
</style>
