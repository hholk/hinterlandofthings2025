<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import { Tabs, TabItem, Accordion, AccordionItem, Button, Card } from 'flowbite-svelte';
  import type { FeatureCollection } from 'geojson';
  import type { PageData } from './$types';
  import { buildVariantGeoJSON, buildVariantLineString } from '$data/chile-travel';
  import type { TravelVariant } from '$data/chile-travel';

  export let data: PageData;

  const { experience, travel } = data;

  let activeVariantId = travel.variants[0]?.id;
  let activeVariant: TravelVariant | undefined = travel.variants[0];
  let mapContainer: HTMLDivElement | null = null;
  let map: maplibregl.Map | null = null;
  // Wir starten mit einer geschlossenen Legende, um die Karte auf kleinen Displays frei zu halten.
  let legendOpen = false;

  const POINT_SOURCE = 'route-points';
  const LINE_SOURCE = 'route-line';
  const LABEL_LAYER = 'route-labels';

  // Für Einsteiger:innen: Sobald sich die ausgewählte Variante ändert, aktualisieren wir die Daten.
  $: activeVariant = travel.variants.find((variant) => variant.id === activeVariantId) ?? travel.variants[0];
  $: if (map && activeVariant) {
    updateMap(activeVariant);
  }

  function updateMap(variant: TravelVariant) {
    if (!map) return;

    const pointSource = map.getSource(POINT_SOURCE) as maplibregl.GeoJSONSource | undefined;
    const lineSource = map.getSource(LINE_SOURCE) as maplibregl.GeoJSONSource | undefined;

    const points = buildVariantGeoJSON(variant);
    const line = buildVariantLineString(variant);

    pointSource?.setData(points as FeatureCollection);
    lineSource?.setData(line as FeatureCollection);

    if (variant.itinerary.length === 0) {
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    for (const stop of variant.itinerary) {
      bounds.extend(stop.coordinates);
    }

    if (variant.itinerary.length === 1) {
      map.flyTo({ center: variant.itinerary[0].coordinates, zoom: 7.5, essential: true });
    } else if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 64, duration: 900, maxZoom: 6.5 });
    }
  }

  onMount(() => {
    if (!mapContainer) return;

    // MapLibre rendert nur im Browser – deshalb erstellen wir die Karte erst hier.
    map = new maplibregl.Map({
      container: mapContainer,
      style: 'https://demotiles.maplibre.org/style.json',
      center: travel.map.center,
      zoom: travel.map.zoom,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    map.on('load', () => {
      if (!map || !activeVariant) return;

      map.addSource(POINT_SOURCE, {
        type: 'geojson',
        data: buildVariantGeoJSON(activeVariant)
      });

      map.addLayer({
        id: POINT_SOURCE,
        type: 'circle',
        source: POINT_SOURCE,
        paint: {
          'circle-radius': 6.5,
          'circle-color': '#38bdf8',
          'circle-stroke-color': '#0f172a',
          'circle-stroke-width': 2
        }
      });

      map.addSource(LINE_SOURCE, {
        type: 'geojson',
        data: buildVariantLineString(activeVariant)
      });

      map.addLayer({
        id: LINE_SOURCE,
        type: 'line',
        source: LINE_SOURCE,
        paint: {
          'line-color': '#f97316',
          'line-width': 3,
          'line-opacity': 0.85
        }
      });

      map.addLayer({
        id: LABEL_LAYER,
        type: 'symbol',
        source: POINT_SOURCE,
        layout: {
          'text-field': ['concat', ['get', 'day'], ' • ', ['get', 'title']],
          'text-size': 11,
          'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          'text-offset': [0, 1.2],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#f8fafc',
          'text-halo-color': '#0f172a',
          'text-halo-width': 1.25
        }
      });

      updateMap(activeVariant);
    });
  });

  onDestroy(() => {
    map?.remove();
    map = null;
  });
</script>

<svelte:head>
  <title>{experience.title} • Modulare Chile-Routen</title>
  <meta
    name="description"
    content="Mobilefreundliche Chile-Routen mit MapLibre-Karte, Flowbite-Komponenten und Roadtrips ab Santiago."
  />
</svelte:head>

<section class="travel-page" data-animate="fade-in">
  <header class="intro">
    <span aria-hidden="true" class="icon">{@html experience.icon}</span>
    <div>
      <h1>{experience.title}</h1>
      <p>{experience.description}</p>
    </div>
  </header>

  <div class="map-section">
    <div class="map-card">
      <!-- Für Einsteiger:innen: Die Karte und die Legende teilen sich diesen Container, damit Mobile-User:innen weniger scrollen müssen. -->
      <div class="map-shell">
        <div class="map-container" bind:this={mapContainer} role="presentation" aria-label="Chile Karte"></div>
        <div class="map-overlay" aria-live="polite">
          <Button
            color="light"
            size="xs"
            class="legend-toggle"
            aria-expanded={legendOpen}
            on:click={() => (legendOpen = !legendOpen)}
          >
            {legendOpen ? 'Legende schließen' : 'Legende anzeigen'}
          </Button>
          {#if legendOpen}
            <div class="map-legend" role="dialog" aria-label="Kartenerklärung">
              <h2>Legende</h2>
              <ul>
                {#each travel.map.legend as entry}
                  <li>
                    <span class="legend-dot" style={`--legend-color: ${entry.color};`}></span>
                    <span>{entry.label}</span>
                  </li>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <div class="variant-selector">
    <Tabs bind:selected={activeVariantId} tabStyle="underline" class="variant-tabs">
      {#each travel.variants as variant}
        <TabItem key={variant.id} title={variant.name}>
          <div class="tab-summary">
            <p>{variant.summary}</p>
            <div class="tab-meta">
              <span>{variant.duration}</span>
              <span>{variant.distanceKm} km</span>
            </div>
          </div>
        </TabItem>
      {/each}
    </Tabs>
  </div>

  {#if activeVariant}
    <section class="variant-details">
      <h2>{activeVariant.name}</h2>
      <p class="variant-summary">{activeVariant.summary}</p>

      <div class="variant-grid">
        <Card class="metrics-card">
          <div class="metrics-header">
            <h3>Highlights & Fakten</h3>
            <p>{activeVariant.duration} • {activeVariant.distanceKm} km Gesamtstrecke</p>
          </div>
          <ul>
            {#each activeVariant.highlights as highlight}
              <li>{highlight}</li>
            {/each}
          </ul>
        </Card>

        <Card class="budget-card">
          <div class="metrics-header">
            <h3>Preiswerte Verbindungen</h3>
            <p>Flüge & Mietwagen, die das Budget schonen.</p>
          </div>
          <div class="budget-columns">
            <div>
              <h4>Flug-Tipps</h4>
              <ul>
                {#each activeVariant.budget.flights as flight}
                  <li>{flight}</li>
                {/each}
              </ul>
            </div>
            <div>
              <h4>Auto-Empfehlungen</h4>
              <ul>
                {#each activeVariant.budget.cars as car}
                  <li>{car}</li>
                {/each}
              </ul>
            </div>
          </div>
        </Card>
      </div>

      <Accordion multiple class="itinerary">
        {#each activeVariant.itinerary as stop, index}
          <AccordionItem title={`${stop.day} • ${stop.title}`} open={index === 0}>
            <p>{stop.description}</p>
          </AccordionItem>
        {/each}
      </Accordion>

      <Card class="insights-card">
        <div class="metrics-header">
          <h3>On-the-ground Insights</h3>
          <p>Praktische Hinweise für einen reibungslosen Ablauf.</p>
        </div>
        <ul>
          {#each activeVariant.insights as insight}
            <li>{insight}</li>
          {/each}
        </ul>
      </Card>
    </section>
  {/if}

  <section class="roadtrips">
    <h2>Roadtrips ab Santiago</h2>
    <p class="roadtrip-intro">
      Drei kompakte Rundfahrten, die du spontan an ein Wochenende anhängen kannst – inklusive Stopps für Genießer:innen.
    </p>
    <div class="roadtrip-grid">
      {#each travel.roadTrips as trip}
        <Card class="roadtrip-card">
          <header>
            <h3>{trip.title}</h3>
            <p>{trip.duration} • {trip.distanceKm} km</p>
          </header>
          <p>{trip.description}</p>
          <h4>Stopps</h4>
          <ol>
            {#each trip.stops as stop}
              <li>{stop}</li>
            {/each}
          </ol>
        </Card>
      {/each}
    </div>
  </section>
</section>

<style>
  .travel-page {
    display: flex;
    flex-direction: column;
    gap: clamp(2rem, 5vw, 3.5rem);
  }

  .intro {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 60ch;
  }

  .icon :global(svg) {
    width: 3rem;
    height: 3rem;
    color: #38bdf8;
  }

  h1 {
    font-size: clamp(2rem, 5vw, 3rem);
    margin: 0;
  }

  h2 {
    font-size: clamp(1.6rem, 4vw, 2.3rem);
    margin: 0 0 0.5rem;
  }

  h3 {
    font-size: clamp(1.2rem, 3vw, 1.5rem);
    margin: 0;
  }

  h4 {
    font-size: 1rem;
    font-weight: 600;
    margin: 1rem 0 0.5rem;
  }

  p {
    margin: 0;
    color: rgba(226, 232, 240, 0.82);
  }

  .map-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .map-card {
    position: relative;
    background: rgba(15, 23, 42, 0.72);
    border: 1px solid rgba(94, 234, 212, 0.08);
    border-radius: 1.25rem;
    padding: 0.75rem;
    box-shadow: 0 20px 45px rgba(15, 23, 42, 0.35);
  }

  .map-shell {
    position: relative;
    border-radius: 1rem;
    overflow: hidden;
  }

  .map-container {
    width: 100%;
    aspect-ratio: 4 / 5;
    min-height: 280px;
  }

  .map-overlay {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    display: grid;
    gap: 0.5rem;
    justify-items: end;
  }

  :global(.legend-toggle) {
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(59, 130, 246, 0.45);
    color: #e2e8f0;
    border-radius: 999px;
    padding-inline: 0.9rem;
    font-weight: 600;
    box-shadow: 0 10px 24px rgba(15, 23, 42, 0.4);
  }

  :global(.legend-toggle:hover) {
    background: rgba(30, 64, 175, 0.55);
  }

  :global(.legend-toggle:focus-visible) {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  .map-legend {
    width: min(240px, 80vw);
    border-radius: 0.9rem;
    background: rgba(15, 23, 42, 0.93);
    border: 1px solid rgba(148, 163, 184, 0.25);
    padding: 0.9rem;
    display: grid;
    gap: 0.65rem;
    box-shadow: 0 15px 30px rgba(15, 23, 42, 0.45);
  }

  .map-legend h2 {
    margin: 0;
    font-size: 1.25rem;
  }

  .map-legend ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 0.5rem;
  }

  .map-legend li {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: rgba(226, 232, 240, 0.88);
  }

  .legend-dot {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 999px;
    background: var(--legend-color);
    display: inline-block;
  }

  .variant-selector {
    display: flex;
    flex-direction: column;
  }

  :global(.variant-tabs [role='tablist']) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  :global(.variant-tabs [role='tablist'] li) {
    margin: 0;
  }

  :global(.variant-tabs [role='tablist'] button) {
    border: none;
    background: rgba(15, 23, 42, 0.58);
    color: rgba(226, 232, 240, 0.8);
    padding: 0.6rem 0.9rem;
    border-radius: 0.85rem;
    font-weight: 600;
    transition: all 0.2s ease;
    min-height: 48px;
  }

  :global(.variant-tabs [role='tablist'] button:hover) {
    color: #e2e8f0;
  }

  :global(.variant-tabs [role='tablist'] button[aria-selected='true']) {
    color: #38bdf8;
    background: rgba(30, 58, 138, 0.65);
    box-shadow: inset 0 0 0 1px rgba(56, 189, 248, 0.6);
  }

  :global(.variant-tabs [role='tablist'] button:focus-visible) {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  :global(.variant-tabs [role='tablist'] + div) {
    display: none;
  }

  :global(.variant-tabs [role='tabpanel']) {
    background: rgba(15, 23, 42, 0.65);
    border: 1px solid rgba(94, 234, 212, 0.12);
    border-radius: 1rem;
    padding: 0.9rem 1.1rem;
  }

  .tab-summary {
    display: grid;
    gap: 0.5rem;
    padding: 1rem 0 0.25rem;
  }

  .tab-meta {
    display: flex;
    gap: 1rem;
    font-size: 0.95rem;
    color: rgba(148, 163, 184, 0.9);
  }

  .variant-details {
    display: grid;
    gap: 1.5rem;
  }

  .variant-summary {
    max-width: 70ch;
  }

  .variant-grid {
    display: grid;
    gap: 1rem;
  }

  :global(.metrics-card),
  :global(.budget-card),
  :global(.insights-card),
  :global(.roadtrip-card) {
    background: rgba(15, 23, 42, 0.78);
    border: 1px solid rgba(94, 234, 212, 0.12);
    border-radius: 1rem;
    padding: 1.25rem;
    display: grid;
    gap: 0.75rem;
  }

  .metrics-header {
    display: grid;
    gap: 0.4rem;
    margin-bottom: 0.75rem;
  }

  :global(.metrics-card ul),
  :global(.budget-card ul),
  :global(.insights-card ul) {
    margin: 0;
    padding-left: 1.1rem;
    display: grid;
    gap: 0.4rem;
    color: rgba(226, 232, 240, 0.88);
  }

  .budget-columns {
    display: grid;
    gap: 1rem;
  }

  .budget-columns ul {
    list-style: disc;
  }

  :global(.itinerary) {
    display: grid;
    gap: 0.75rem;
  }

  :global(.itinerary .group) {
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 0.9rem;
    background: rgba(15, 23, 42, 0.7);
    overflow: hidden;
  }

  :global(.itinerary h2) {
    margin: 0;
  }

  :global(.itinerary h2 button) {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.75rem;
    padding: 0.9rem 1.1rem;
    background: transparent;
    border: none;
    color: rgba(226, 232, 240, 0.92);
    font-weight: 600;
    cursor: pointer;
  }

  :global(.itinerary h2 button:hover) {
    background: rgba(59, 130, 246, 0.14);
  }

  :global(.itinerary h2 button:focus-visible) {
    outline: 2px solid #38bdf8;
    outline-offset: 2px;
  }

  :global(.itinerary h2 svg) {
    width: 0.75rem;
    height: 0.75rem;
    color: #38bdf8;
  }

  :global(.itinerary .border-b) {
    border: none;
  }

  :global(.itinerary .p-5),
  :global(.itinerary .py-5) {
    padding: 0.75rem 1.1rem;
  }

  :global(.itinerary .p-5),
  :global(.itinerary .py-5),
  :global(.itinerary .border-s),
  :global(.itinerary .border-e) {
    border: none;
  }

  :global(.itinerary .border-gray-200),
  :global(.itinerary .dark\:border-gray-700) {
    border: none;
  }

  :global(.itinerary .border-s),
  :global(.itinerary .border-e) {
    border: none;
  }

  :global(.itinerary .p-5 > div),
  :global(.itinerary .py-5 > div),
  :global(.itinerary .content) {
    color: rgba(226, 232, 240, 0.88);
  }

  .roadtrips {
    display: grid;
    gap: 1rem;
  }

  .roadtrip-intro {
    max-width: 70ch;
  }

  .roadtrip-grid {
    display: grid;
    gap: 1rem;
  }

  :global(.roadtrip-card header) {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  :global(.roadtrip-card ol) {
    margin: 0;
    padding-left: 1.1rem;
    display: grid;
    gap: 0.35rem;
    color: rgba(226, 232, 240, 0.88);
  }

  @media (min-width: 768px) {
    .map-card {
      padding: 1.25rem;
    }

    .map-container {
      aspect-ratio: 16 / 9;
      min-height: 420px;
    }

    .variant-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .budget-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .roadtrip-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
</style>
