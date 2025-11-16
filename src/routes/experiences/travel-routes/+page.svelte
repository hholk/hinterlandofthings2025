<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import type {
    RouteDetail,
    RouteIndexEntry,
    DayDefinition,
    DayArrivalSegment,
    ActivityRestaurant,
    RouteStop,
    RouteSegment,
    FlightInfo,
    LodgingInfo,
    FoodInfo,
    ActivityInfo,
    LoadedTravelRoutesDataset,
    MobilityOption
  } from '../../../lib/data/chile-travel';
  const DEFAULT_MODE_LABEL = 'Segment';

  export let data: PageData & { travel: LoadedTravelRoutesDataset };

  function getModeAppearance(mode: string | undefined) {
    // Für Einsteiger:innen: Statt MapLibre-Layern greifen wir nun direkt auf
    // die im Datensatz gepflegten Transport-Modi zu, um konsistente Labels für
    // Timeline & Hinweise zu erzeugen.
    if (!mode) {
      return { label: DEFAULT_MODE_LABEL };
    }
    const appearance = data.travel.transportModes[mode];
    if (appearance) return appearance;
    return { label: DEFAULT_MODE_LABEL };
  }

  interface TimelineStep {
    order: number;
    label: string;
    description?: string;
    dayId?: string;
  }

  interface StopSegmentEntry {
    segment: RouteSegment;
    direction: 'arrival' | 'departure';
    fromStop?: RouteStop;
    toStop?: RouteStop;
  }

  interface StopFlightEntry {
    flight: FlightInfo;
    direction: 'arrival' | 'departure';
    fromStop?: RouteStop;
    toStop?: RouteStop;
  }

  interface StopDataIndex {
    segments: Record<string, StopSegmentEntry[]>;
    flights: Record<string, StopFlightEntry[]>;
    lodging: Record<string, LodgingInfo[]>;
    food: Record<string, FoodInfo[]>;
    activities: Record<string, ActivityInfo[]>;
    notes: Record<string, string[]>;
  }

  function createEmptyStopDataIndex(): StopDataIndex {
    return {
      segments: {},
      flights: {},
      lodging: {},
      food: {},
      activities: {},
      notes: {}
    };
  }

  function pushValue<T>(collection: Record<string, T[]>, key: string | undefined, value: T | undefined) {
    if (!key || value === undefined) return;
    if (!collection[key]) {
      collection[key] = [];
    }
    collection[key].push(value);
  }

  function buildStopDataIndex(route: RouteDetail | null): StopDataIndex {
    if (!route) return createEmptyStopDataIndex();
    const index = createEmptyStopDataIndex();
    const stopMap = new Map<string, RouteStop>();
    (route.stops ?? []).forEach((stop) => {
      if (stop.id) {
        stopMap.set(stop.id, stop);
        if (Array.isArray(stop.notes)) {
          stop.notes.forEach((note) => pushValue(index.notes, stop.id, note));
        }
      }
    });

    (route.segments ?? []).forEach((segment) => {
      const fromStop = segment.from ? stopMap.get(segment.from) : undefined;
      const toStop = segment.to ? stopMap.get(segment.to) : undefined;
      pushValue(index.segments, segment.from, {
        segment,
        direction: 'departure',
        fromStop,
        toStop
      });
      pushValue(index.segments, segment.to, {
        segment,
        direction: 'arrival',
        fromStop,
        toStop
      });
    });

    (route.flights ?? []).forEach((flight) => {
      const fromStop = stopMap.get(flight.fromStopId);
      const toStop = stopMap.get(flight.toStopId);
      pushValue(index.flights, flight.fromStopId, {
        flight,
        direction: 'departure',
        fromStop,
        toStop
      });
      pushValue(index.flights, flight.toStopId, {
        flight,
        direction: 'arrival',
        fromStop,
        toStop
      });
    });

    (route.lodging ?? []).forEach((stay) => {
      pushValue(index.lodging, stay.stopId, stay);
    });

    (route.food ?? []).forEach((spot) => {
      pushValue(index.food, spot.stopId, spot);
    });

    (route.activities ?? []).forEach((activity) => {
      pushValue(index.activities, activity.stopId, activity);
    });

    if (route.notes && route.stops?.[0]?.id) {
      pushValue(index.notes, route.stops[0].id, route.notes);
    }

    return index;
  }

  let selectedRouteId = data.travel.routeIndex[0]?.id ?? '';
  let selectedRoute: RouteDetail | null = data.travel.routes[selectedRouteId] ?? null;
  let selectedIndexEntry: RouteIndexEntry | null =
    data.travel.routeIndex.find((entry) => entry.id === selectedRouteId) ?? null;
  let selectedMapFocus: RouteIndexEntry['mapFocus'] | null = selectedIndexEntry?.mapFocus ?? null;
  let sliderSteps: TimelineStep[] = [];
  let stopDataIndex: StopDataIndex = createEmptyStopDataIndex();

  const hasDocument = typeof document !== 'undefined';

  const numberFormatter = new Intl.NumberFormat('de-DE');
  const decimalFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 });
  const currencyFormatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: data.travel.meta.currency ?? 'EUR'
  });
  const coordinateFormatter = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 2 });

  // Für Einsteiger:innen: MapLibre möchte eine Liste konkreter Tile-URLs.
  // Unser Datensatz nutzt teilweise das Platzhalter-Format "https://{s}.tile...",
  // deshalb erzeugen wir hier eine bereinigte Variante ohne Überraschungen.
  function selectRoute(id: string) {
    if (id === selectedRouteId) return;
    selectedRouteId = id;
  }

  function addBodyTheme() {
    if (!hasDocument) return;
    document.body.classList.add('travel-body');
  }

  function removeBodyTheme() {
    if (!hasDocument) return;
    document.body.classList.remove('travel-body');
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
          const appearance = getModeAppearance(firstSegment.mode ?? 'segment');
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
        const appearance = getModeAppearance(segment.mode);
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

  onMount(() => {
    addBodyTheme();
    return () => {
      removeBodyTheme();
    };
  });

  function formatMapCenter(center: [number, number] | undefined | null) {
    if (!Array.isArray(center) || center.length !== 2) return null;
    const [lng, lat] = center;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    const lngLabel = `${coordinateFormatter.format(Math.abs(lng))}° ${lng >= 0 ? 'O' : 'W'}`;
    const latLabel = `${coordinateFormatter.format(Math.abs(lat))}° ${lat >= 0 ? 'N' : 'S'}`;
    return `${lngLabel} · ${latLabel}`;
  }

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

  function formatTime(value: string | undefined) {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
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

  function getDayFlights(day: DayDefinition | undefined): DayArrivalSegment[] {
    if (!day?.arrival?.segments) return [];
    return day.arrival.segments.filter((segment) => {
      const candidate = segment as DayArrivalSegment & {
        flightNumber?: string;
        airline?: string;
      };
      return candidate.mode === 'flight' || Boolean(candidate.flightNumber) || Boolean(candidate.airline);
    });
  }

  function getDayRestaurants(day: DayDefinition | undefined): ActivityRestaurant[] {
    if (!day?.activities?.length) return [];
    return day.activities
      .flatMap((activity) => activity.restaurants ?? [])
      .filter((restaurant): restaurant is ActivityRestaurant => Boolean(restaurant));
  }

  function getDayNotes(day: DayDefinition | undefined): string[] {
    const notes: string[] = [];
    if (day?.station?.description) {
      notes.push(day.station.description);
    }
    if (day?.station?.timezone) {
      notes.push(`Zeitzone: ${day.station.timezone}`);
    }
    return notes;
  }

  function getDaySegments(day: DayDefinition | undefined): DayArrivalSegment[] {
    return day?.arrival?.segments ?? [];
  }

  function getStopSegments(stopId: string | undefined): StopSegmentEntry[] {
    if (!stopId) return [];
    return stopDataIndex.segments[stopId] ?? [];
  }

  function getStopFlights(stopId: string | undefined): StopFlightEntry[] {
    if (!stopId) return [];
    return stopDataIndex.flights[stopId] ?? [];
  }

  function getStopLodging(stopId: string | undefined): LodgingInfo[] {
    if (!stopId) return [];
    return stopDataIndex.lodging[stopId] ?? [];
  }

  function getStopFood(stopId: string | undefined): FoodInfo[] {
    if (!stopId) return [];
    return stopDataIndex.food[stopId] ?? [];
  }

  function getStopActivities(stopId: string | undefined): ActivityInfo[] {
    if (!stopId) return [];
    return stopDataIndex.activities[stopId] ?? [];
  }

  function getStopNotes(stopId: string | undefined): string[] {
    if (!stopId) return [];
    return stopDataIndex.notes[stopId] ?? [];
  }

  $: selectedIndexEntry = data.travel.routeIndex.find((entry) => entry.id === selectedRouteId) ?? null;
  $: selectedRoute = data.travel.routes[selectedRouteId] ?? null;
  $: selectedMapFocus = selectedIndexEntry?.mapFocus ?? null;
  $: stopDataIndex = buildStopDataIndex(selectedRoute);
  $: sliderSteps = buildTimeline(selectedRoute, selectedIndexEntry);
</script>

<svelte:head>
  <title>{data.experience?.title ?? 'Chile Travel Experience'}</title>
  <meta
    name="description"
    content={
      data.experience?.description ??
        'Detaillierte Chile-Routen mit Stopps, Transportplanung und Insider-Tipps.'
    }
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
    <nav
      class="travel__routes"
      aria-label="Routen auswählen"
    >
      <div class="travel__routes-header">
        <h2>Routenübersicht</h2>
        <p class="travel__routes-hint">
          Jede Option enthält Entfernungen, Transport und Unterkünfte für jeden Halt.
        </p>
      </div>
      <!-- Für Einsteiger:innen: Die Liste verwendet Scroll-Snap, damit wirklich nur eine horizontale Reihe sichtbar ist
           und wir per Wischgeste durch die Karten sliden können. -->
      <ul class="travel__route-track">
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
    </nav>
    {#if selectedMapFocus}
      <section
        class="travel__map-section"
        aria-labelledby="travel-map-focus-title"
      >
        <div class="travel__map-section-head">
          <p class="travel__map-section-label">Kartenausschnitt</p>
          <h2 id="travel-map-focus-title">{selectedMapFocus.region ?? 'Karte'}</h2>
          {#if selectedMapFocus.description}
            <p>{selectedMapFocus.description}</p>
          {/if}
        </div>
        <dl class="travel__map-section-meta">
          <div>
            <dt>Region</dt>
            <dd>{selectedMapFocus.region ?? 'Chile'}</dd>
          </div>
          {#if formatMapCenter(selectedMapFocus.center)}
            <div>
              <dt>Koordinaten</dt>
              <dd>{formatMapCenter(selectedMapFocus.center)}</dd>
            </div>
          {/if}
          {#if selectedMapFocus.zoom !== undefined}
            <div>
              <dt>Empfohlener Zoom</dt>
              <dd>{decimalFormatter.format(selectedMapFocus.zoom)}</dd>
            </div>
          {/if}
        </dl>
      </section>
    {/if}

    <article class="travel__detail" aria-labelledby="route-title">
      <header class="travel__detail-header">
        <div>
          <h2 id="route-title">{selectedRoute.name}</h2>
          {#if selectedRoute.summary}
            <p>{selectedRoute.summary}</p>
          {/if}
        </div>
        <!-- Für Einsteiger:innen: Das Definition-List-Pattern bleibt erhalten, aber per Flexbox entstehen echte
             "Kacheln", die sich auf großen Screens in einer horizontalen Reihe anordnen. -->
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
            <summary>Zeitverlauf der Etappen</summary>
            <div class="travel__spoiler-content">
              <p>Der Zeitverlauf hilft dir, Ortswechsel und Schwerpunkte jeder Route schnell nachzuvollziehen.</p>
              <ol class="travel__timeline">
                {#each sliderSteps as step, index}
                  <li>
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
                    <div class="travel__stop-extras">
                      {#if getStopSegments(stop.id).length}
                        <details class="travel__mini-details">
                          <summary>Transporte &amp; Segmente</summary>
                          <ul class="travel__data-list">
                            {#each getStopSegments(stop.id) as item}
                              <li>
                                <strong>
                                  {item.direction === 'arrival' ? 'Ankunft' : 'Weiterreise'} ·
                                  {getModeAppearance(item.segment.mode).label}
                                </strong>
                                <div>
                                  {item.fromStop?.name ?? item.segment.from ?? 'Start'} →
                                  {item.toStop?.name ?? item.segment.to ?? 'Ziel'}
                                  {#if item.segment.distanceKm}
                                    · {numberFormatter.format(item.segment.distanceKm)} km
                                  {/if}
                                  {#if item.segment.durationHours}
                                    · {decimalFormatter.format(item.segment.durationHours)} h
                                  {/if}
                                  {#if item.segment.carbonKg}
                                    · {numberFormatter.format(item.segment.carbonKg)} kg CO₂
                                  {/if}
                                </div>
                                {#if item.segment.operator}
                                  <div>Betreiber: {item.segment.operator}</div>
                                {/if}
                                {#if item.segment.description}
                                  <p>{item.segment.description}</p>
                                {/if}
                              </li>
                            {/each}
                          </ul>
                        </details>
                      {/if}

                      {#if getStopFlights(stop.id).length}
                        <details class="travel__mini-details">
                          <summary>Flüge</summary>
                          <ul class="travel__data-list">
                            {#each getStopFlights(stop.id) as entry}
                              <li>
                                <strong>
                                  {entry.fromStop?.name ?? entry.flight.fromStopId} →
                                  {entry.toStop?.name ?? entry.flight.toStopId}
                                </strong>
                                <div>
                                  {entry.direction === 'arrival' ? 'Ankunft' : 'Abflug'} an diesem Stopp ·
                                  {entry.flight.airline
                                    ? `${entry.flight.airline}${entry.flight.flightNumber ? ` • ${entry.flight.flightNumber}` : ''}`
                                    : entry.flight.flightNumber ?? 'Flug'}
                                </div>
                                <div>
                                  {#if entry.flight.durationHours}
                                    {decimalFormatter.format(entry.flight.durationHours)} h
                                  {/if}
                                  {#if entry.flight.carbonKg}
                                    · {numberFormatter.format(entry.flight.carbonKg)} kg CO₂
                                  {/if}
                                  {#if entry.flight.price !== undefined}
                                    · {formatCurrency(entry.flight.price) ?? ''}
                                  {/if}
                                </div>
                                {#if entry.flight.baggage}
                                  <p>Gepäck: {entry.flight.baggage}</p>
                                {/if}
                              </li>
                            {/each}
                          </ul>
                        </details>
                      {/if}

                      {#if getStopLodging(stop.id).length}
                        <details class="travel__mini-details">
                          <summary>Unterkünfte</summary>
                          <ul class="travel__lodging-list">
                            {#each getStopLodging(stop.id) as stay}
                              <li>
                                <h4>{stay.name}</h4>
                                <p class="travel__lodging-meta">
                                  {stay.city ?? stop.city ?? 'Chile'} · {stay.nights ?? 0} Nächte ·
                                  {stay.pricePerNight ? `${formatCurrency(stay.pricePerNight)} pro Nacht` : 'Preis auf Anfrage'}
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
                        </details>
                      {/if}

                      {#if getStopFood(stop.id).length}
                        <details class="travel__mini-details">
                          <summary>Kulinarik</summary>
                          <ul class="travel__food-list">
                            {#each getStopFood(stop.id) as spot}
                              <li>
                                <h4>{spot.name}</h4>
                                <p class="travel__food-meta">
                                  {spot.city ?? stop.city ?? 'Chile'} · {spot.priceRange ?? 'Preis variiert'}
                                </p>
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
                        </details>
                      {/if}

                      {#if getStopActivities(stop.id).length}
                        <details class="travel__mini-details">
                          <summary>Aktivitäten</summary>
                          <ul class="travel__activity-list">
                            {#each getStopActivities(stop.id) as activity}
                              <li>
                                <h4>{activity.title ?? activity.name}</h4>
                                <p class="travel__activity-meta">
                                  {activity.location ?? activity.stopId ?? stop.city ?? 'Unterwegs'} ·
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
                              </li>
                            {/each}
                          </ul>
                        </details>
                      {/if}

                      {#if getStopNotes(stop.id).length}
                        <details class="travel__mini-details">
                          <summary>Hinweise</summary>
                          <ul class="travel__data-list">
                            {#each getStopNotes(stop.id) as note}
                              <li>{note}</li>
                            {/each}
                          </ul>
                        </details>
                      {/if}
                    </div>
                  </li>
                {/each}
              </ol>
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
                    {#if getDaySegments(day).length}
                      <details class="travel__mini-details" open>
                        <summary>Transporte &amp; Segmente</summary>
                        <ul class="travel__data-list">
                          {#each getDaySegments(day) as segment}
                            <li>
                              <strong>{getModeAppearance(segment.mode ?? '').label}</strong>
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
                    {#if getDayFlights(day).length}
                      <details class="travel__mini-details">
                        <summary>Flüge</summary>
                        <ul class="travel__data-list">
                          {#each getDayFlights(day) as flight}
                            <li>
                              <strong>{flight.from?.name ?? 'Start'} → {flight.to?.name ?? 'Ziel'}</strong>
                              <div>
                                {flight.airline ? `${flight.airline}${flight.flightNumber ? ` • ${flight.flightNumber}` : ''}` : flight.flightNumber ?? 'Verbindung'}
                              </div>
                              <div>
                                {formatDate(flight.departure)}
                                {#if formatTime(flight.departure)}
                                  · Abflug {formatTime(flight.departure)}
                                {/if}
                                {#if formatTime(flight.arrival)}
                                  · Ankunft {formatTime(flight.arrival)}
                                {/if}
                              </div>
                              {#if (flight as any).baggage}
                                <p>Gepäck: {(flight as any).baggage}</p>
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                    {#if day.hotels?.length}
                      <details class="travel__mini-details">
                        <summary>Unterkünfte</summary>
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
                    {#if getDayRestaurants(day).length}
                      <details class="travel__mini-details">
                        <summary>Kulinarik</summary>
                        <ul class="travel__data-list">
                          {#each getDayRestaurants(day) as restaurant}
                            <li>
                              <strong>{restaurant.name}</strong>
                              {#if restaurant.description}
                                <p>{restaurant.description}</p>
                              {/if}
                            </li>
                          {/each}
                        </ul>
                      </details>
                    {/if}
                    {#if day.activities?.length}
                      <details class="travel__mini-details" open>
                        <summary>Aktivitäten</summary>
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
                    {#if getDayNotes(day).length}
                      <details class="travel__mini-details">
                        <summary>Hinweise</summary>
                        <ul class="travel__data-list">
                          {#each getDayNotes(day) as note}
                            <li>{note}</li>
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
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
  }

  .travel__map-section {
    border-radius: 1.25rem;
    background: rgba(15, 23, 42, 0.03);
    border: 1px solid rgba(15, 23, 42, 0.08);
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .travel__map-section-head h2 {
    font-size: 1.35rem;
    margin: 0.15rem 0 0;
  }

  .travel__map-section-head p {
    color: #475569;
    margin: 0.25rem 0 0;
  }

  .travel__map-section-label {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.75rem;
    color: #6366f1;
    margin: 0;
  }

  .travel__map-section-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .travel__map-section-meta dt {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
  }

  .travel__map-section-meta dd {
    margin: 0.1rem 0 0;
    font-weight: 600;
    color: #0f172a;
  }

  .travel__routes {
    background: rgba(15, 23, 42, 0.04);
    border-radius: 1.25rem;
    padding: 1.25rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .travel__routes-header {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .travel__routes h2 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
  }

  .travel__routes-hint {
    margin: 0;
    color: #475569;
    font-size: 0.9rem;
  }

  /* Für Einsteiger:innen: Grid + Scroll-Snap sorgt dafür, dass die Karten exakt eine Reihe bilden
     und per Trackpad/Touch sanft sliden – ganz ohne zusätzliche Slider-Bibliothek. */
  .travel__route-track {
    list-style: none;
    margin: 0;
    padding: 0.25rem 0 0.75rem;
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(min(20rem, 85vw), 1fr);
    gap: 1rem;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scroll-snap-type: x mandatory;
    scroll-padding-inline: 0.75rem;
  }

  .travel__route-track li {
    scroll-snap-align: center;
  }

  .travel__route-track button {
    width: 100%;
    min-width: unset;
    height: 100%;
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

  .travel__route-track button:hover,
  .travel__route-track button:focus-visible {
    border-color: var(--route-color);
    box-shadow: 0 14px 30px rgba(99, 102, 241, 0.2);
    transform: translateY(-1px);
    outline: none;
  }

  .travel__route-track button.selected {
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
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin: 0;
    justify-content: flex-end;
  }

  .travel__metrics div {
    background: rgba(99, 102, 241, 0.08);
    border-radius: 0.75rem;
    padding: 0.85rem 1.1rem;
    min-width: min(12rem, 100%);
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
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

  .travel__stop-extras {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.5rem;
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

  @media (min-width: 960px) {
    .travel__route-track {
      grid-auto-columns: minmax(20rem, 24rem);
      padding-inline: 0.5rem;
    }

    .travel__route-track li {
      scroll-snap-align: start;
    }
  }

  @media (max-width: 720px) {
    .travel {
      padding: 1.25rem 1rem 2.5rem;
    }

    .travel__routes {
      padding: 1rem;
    }

    .travel__route-track {
      gap: 0.75rem;
      padding: 0.25rem 0;
    }

    .travel__detail {
      padding: 1.25rem;
    }
  }
</style>
