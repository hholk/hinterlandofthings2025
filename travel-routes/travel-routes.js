/**
 * Travel Routes Entry Script
 * --------------------------
 * Dieses Modul lädt die JSON-Daten, initialisiert die Leaflet-Karte und rendert
 * sämtliche UI-Elemente. Wir vermeiden Frameworks, daher ist der Code stark in
 * kleine, gut kommentierte Hilfsfunktionen aufgeteilt – so bleibt alles für
 * Einsteiger:innen nachvollziehbar.
 */

const hasDocument = typeof document !== 'undefined';

const state = {
  data: null,
  curatedRoutes: [],
  customRoutes: [],
  filter: 'curated',
  activeTags: new Set(),
  searchTerm: '',
  selectedRouteId: null,
};

const mapState = {
  map: null,
  layers: new Map(),
  modeLegend: null,
};

const dom = hasDocument
  ? {
      app: document.querySelector('.travel-app'),
      routeList: document.getElementById('travel-route-list'),
      detail: document.getElementById('travel-detail'),
      search: document.getElementById('travel-search'),
      gallery: document.getElementById('travel-gallery'),
      events: document.getElementById('travel-events'),
      tagList: document.getElementById('travel-tag-list'),
      markdownInput: document.getElementById('travel-md'),
      markdownPreview: document.getElementById('travel-md-preview'),
      markdownRender: document.getElementById('travel-md-render'),
      markdownClear: document.getElementById('travel-md-clear'),
      panel: document.querySelector('.travel-panel'),
      panelToggle: document.querySelector('.travel-panel-toggle'),
      chipButtons: document.querySelectorAll('.travel-chip'),
    }
  : {
      app: null,
      routeList: null,
      detail: { innerHTML: '' },
      search: { value: '', addEventListener() {} },
      gallery: { innerHTML: '' },
      events: { innerHTML: '' },
      tagList: { innerHTML: '', appendChild() {} },
      markdownInput: { value: '' },
      markdownPreview: { innerHTML: '' },
      markdownRender: { addEventListener() {} },
      markdownClear: { addEventListener() {} },
      panel: null,
      panelToggle: null,
      chipButtons: [],
    };

const templates = hasDocument
  ? {
      routeCard: document.getElementById('tpl-route-card'),
      flightRow: document.getElementById('tpl-flight-row'),
      stopItem: document.getElementById('tpl-stop-item'),
      costRow: document.getElementById('tpl-cost-row'),
    }
  : {
      routeCard: { content: { firstElementChild: null } },
      flightRow: { content: { firstElementChild: null } },
      stopItem: { content: { firstElementChild: null } },
      costRow: { content: { firstElementChild: null } },
    };

const LOCAL_STORAGE_KEY = 'travel-routes.custom';
const NOTES_KEY = 'travel-routes.notes';

if (hasDocument) {
  init().catch((error) => {
    console.error('Travel routes failed to initialize', error);
    if (dom.detail) {
      dom.detail.innerHTML = `<div class="travel-empty-state">Fehler beim Laden: ${error.message}</div>`;
    }
  });
}

async function init() {
  const response = await fetch('travel-routes-data.json');
  if (!response.ok) {
    throw new Error(`Daten konnten nicht geladen werden (${response.status})`);
  }
  const data = await response.json();
  state.data = data;
  state.curatedRoutes = data.routes.map((route) => ({ ...route, source: 'curated' }));
  state.customRoutes = loadCustomRoutes();

  initMap(data);
  renderTags();
  renderGallery();
  renderEvents();
  renderRoutes();
  setupFilterChips();
  setupSearch();
  setupMarkdown();
  setupPanelToggle();

  dom.app?.setAttribute('data-state-ready', 'true');

  const initialRoute = state.curatedRoutes[0] ?? state.customRoutes[0];
  if (initialRoute) {
    selectRoute(initialRoute.id, initialRoute.source);
  } else {
    dom.detail.innerHTML = '<div class="travel-empty-state">Noch keine Routen vorhanden.</div>';
  }
}

function initMap(data) {
  const { map } = data.meta;
  mapState.map = L.map('travel-map', {
    zoomControl: true,
    minZoom: 3,
    worldCopyJump: true,
  }).setView(map.center, map.zoom);

  L.tileLayer(map.tileLayer, { attribution: map.attribution, maxZoom: 18 }).addTo(mapState.map);

  mapState.modeLegend = L.control({ position: 'topright' });
  mapState.modeLegend.onAdd = () => {
    const div = L.DomUtil.create('div', 'travel-map-legend');
    div.innerHTML = Object.entries(state.data.transportModes)
      .map(([, mode]) => {
        const dash = mode.dashArray ? `border-top-style: dashed; border-top-width: 4px; border-top-color: ${mode.color};` : '';
        const meta = [
          mode.averageSpeedKmh ? `${mode.averageSpeedKmh} km/h` : '',
          typeof mode.carbonPerKm === 'number' ? `${mode.carbonPerKm.toFixed(3)} kg CO₂/km` : '',
        ]
          .filter(Boolean)
          .join(' · ');
        return `<div class="travel-map-legend__item" title="${mode.description ?? ''}">
          <span class="travel-map-legend__swatch" style="border-top-color:${mode.color};${dash}"></span>
          <div>
            <div>${mode.icon} ${mode.label}</div>
            ${meta ? `<div class="travel-map-legend__meta">${meta}</div>` : ''}
          </div>
        </div>`;
      })
      .join('');
    return div;
  };
  mapState.modeLegend.addTo(mapState.map);
}

function renderRoutes() {
  if (!dom.routeList || !templates.routeCard.content?.firstElementChild) return;
  const routes = getVisibleRoutes();
  dom.routeList.innerHTML = '';

  if (routes.length === 0) {
    dom.routeList.innerHTML = `<div class="travel-empty-state">
      Keine Route gefunden.
      ${state.filter === 'custom' ? '<br/>Lege eine eigene Route an, um hier Inhalte zu sehen.' : ''}
    </div>`;
    if (state.filter === 'custom') {
      dom.routeList.appendChild(buildCreateCustomButton());
    }
    return;
  }

  routes.forEach((route) => {
    const card = templates.routeCard.content.firstElementChild.cloneNode(true);
    card.querySelector('.travel-card__title').textContent = route.name;
    card.querySelector('.travel-card__subtitle').textContent = route.meta?.theme ?? 'Thema unbekannt';
    card.querySelector('.travel-card__badge').innerHTML = `<span class="travel-icon-dot" style="background:${route.color}"></span> ${route.meta?.pace ?? ''}`;
    card.querySelector('.travel-card__description').textContent = route.summary ?? '';

    const metaList = card.querySelector('.travel-card__meta');
    metaList.innerHTML = '';
    const metrics = route.metrics ?? {};
    addMeta(metaList, 'Tage', route.meta?.durationDays ?? state.data.meta.defaultDurationDays);
    addMeta(metaList, 'Kosten ~€', formatCurrency(route.meta?.costEstimate ?? 0));
    addMeta(metaList, 'Ø/Tag €', metrics.averageDailyBudget ? formatCurrency(metrics.averageDailyBudget) : '—');
    addMeta(metaList, 'Distanz', metrics.totalDistanceKm ? `${metrics.totalDistanceKm.toLocaleString('de-DE')} km` : '—');
    addMeta(metaList, 'CO₂', metrics.estimatedCarbonKg ? `${metrics.estimatedCarbonKg.toLocaleString('de-DE')} kg` : '—');
    addMeta(metaList, 'Tags', route.tags?.map((tag) => tagLabel(tag)).join(', ') || '—');

    const actions = card.querySelector('.travel-card__actions');
    const viewBtn = document.createElement('button');
    viewBtn.className = 'travel-button';
    viewBtn.textContent = 'Details anzeigen';
    viewBtn.addEventListener('click', () => selectRoute(route.id, route.source));
    actions.appendChild(viewBtn);

    if (route.source === 'curated') {
      const copyBtn = document.createElement('button');
      copyBtn.className = 'travel-button travel-button--secondary';
      copyBtn.textContent = 'Als Vorlage übernehmen';
      copyBtn.addEventListener('click', () => {
        addCustomRouteFromCurated(route.id);
      });
      actions.appendChild(copyBtn);
    } else {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'travel-button travel-button--secondary';
      deleteBtn.textContent = 'Route löschen';
      deleteBtn.addEventListener('click', () => {
        deleteCustomRoute(route.id);
      });
      actions.appendChild(deleteBtn);
    }

    dom.routeList.appendChild(card);
  });

  if (state.filter === 'custom') {
    dom.routeList.appendChild(buildCreateCustomButton());
  }
}

function getVisibleRoutes() {
  const collection = state.filter === 'custom' ? state.customRoutes : state.curatedRoutes;
  if (!state.searchTerm && state.activeTags.size === 0) {
    return collection;
  }
  const term = state.searchTerm.toLowerCase();
  return collection.filter((route) => {
    const matchesTag = state.activeTags.size === 0 || route.tags?.some((tag) => state.activeTags.has(tag));
    if (!matchesTag) return false;
    if (!term) return true;
    const haystack = [
      route.name,
      route.summary,
      route.meta?.theme,
      ...(route.tags ?? []),
      ...(route.stops ?? []).map((stop) => stop.name),
      ...(route.food ?? []).map((item) => item.name),
      ...(route.activities ?? []).map((item) => item.title),
      ...(route.flights ?? []).map((flight) => flight.flightNumber),
      String(route.metrics?.totalDistanceKm ?? ''),
      String(route.metrics?.estimatedCarbonKg ?? ''),
      String(route.metrics?.averageDailyBudget ?? ''),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
}

function selectRoute(routeId, source = state.filter) {
  state.selectedRouteId = routeId;
  state.filter = source === 'custom' ? 'custom' : state.filter;
  const route = findRoute(routeId);
  if (!route) return;
  activateMapLayer(route);
  renderRouteDetail(route);
}

function renderRouteDetail(route) {
  if (!dom.detail) return;
  const meta = route.meta ?? {};
  const tags = route.tags?.map((tag) => `<span class="travel-pill">${tagLabel(tag)}</span>`).join(' ');
  const costItems = route.costBreakdown?.items ?? [];
  const costTotal = costItems.reduce((sum, item) => sum + (Number(item.estimate) || 0), 0);

  const flights = route.flights ?? [];
  const stops = route.stops ?? [];
  const metrics = route.metrics ?? {};

  dom.detail.innerHTML = `
    <header class="travel-detail__header">
      <div>
        <h2 class="travel-detail__title">${route.name}</h2>
        <div class="travel-detail__meta">
          <span>${meta.theme ?? 'Thema offen'}</span>
          <span>${meta.durationDays ?? state.data.meta.defaultDurationDays} Tage</span>
          <span>Tempo: ${meta.pace ?? 'n/a'}</span>
          <span>Kosten ~€${formatCurrency(meta.costEstimate ?? 0)}</span>
        </div>
        <div class="travel-detail__meta">${tags ?? ''}</div>
        <div class="travel-detail__metrics">${renderMetrics(metrics)}</div>
      </div>
      ${route.source === 'curated'
        ? '<span class="travel-status">Kuratierte Vorlage</span>'
        : '<span class="travel-status">Eigene Route</span>'}
    </header>
    <p class="travel-detail__summary">${route.summary ?? ''}</p>

    <section>
      <h3>Streckenverlauf & Stopps</h3>
      <ul class="travel-stop-list" id="travel-stop-list"></ul>
    </section>

    <section>
      <h3>Transfers & Segmentdetails</h3>
      ${renderSegments(route)}
    </section>

    <section class="travel-columns">
      <div>
        <h3>Flüge & lange Transfers</h3>
        <ul class="travel-flight-list" id="travel-flight-list"></ul>
      </div>
      <div>
        <h3>Kostenaufstellung</h3>
        <table class="travel-table">
          <thead><tr><th>Kategorie</th><th>Schätzung (€)</th><th>Hinweis</th></tr></thead>
          <tbody id="travel-cost-table"></tbody>
          <tfoot><tr><th>Summe</th><th>€${formatCurrency(costTotal)}</th><th></th></tr></tfoot>
        </table>
      </div>
    </section>

    <section class="travel-columns">
      <div>
        <h3>Unterkünfte</h3>
        ${renderLodging(route.lodging)}
      </div>
      <div>
        <h3>Food & Drinks</h3>
        ${renderFood(route.food)}
      </div>
    </section>

    <section>
      <h3>Aktivitäten</h3>
      ${renderActivities(route.activities)}
    </section>

    ${route.source === 'custom' ? renderCustomEditor(route) : ''}
  `;

  renderStopList(route, stops);
  renderFlightList(route, flights);
  renderCostRows(costItems);
}

function renderMetrics(metrics) {
  if (!metrics) {
    return '<span class="travel-text-muted">Noch keine Kennzahlen verfügbar.</span>';
  }

  const items = [];

  if (metrics.totalDistanceKm) {
    items.push(`<span class="travel-metric">📏 ${metrics.totalDistanceKm.toLocaleString('de-DE')} km</span>`);
  }
  if (metrics.estimatedCarbonKg) {
    items.push(`<span class="travel-metric">🌱 ${metrics.estimatedCarbonKg.toLocaleString('de-DE')} kg CO₂e</span>`);
  }
  if (metrics.groundTransportCarbonKg) {
    items.push(
      `<span class="travel-metric">🚍 ${metrics.groundTransportCarbonKg.toLocaleString('de-DE')} kg CO₂e (Land)</span>`
    );
  }
  if (metrics.flightCount) {
    items.push(`<span class="travel-metric">✈️ ${metrics.flightCount} Flüge</span>`);
  }
  if (metrics.lodgingCount) {
    items.push(`<span class="travel-metric">🛏️ ${metrics.lodgingCount} Unterkünfte</span>`);
  }
  if (metrics.foodCount) {
    items.push(`<span class="travel-metric">🍽️ ${metrics.foodCount} Food-Spots</span>`);
  }
  if (metrics.activityCount) {
    items.push(`<span class="travel-metric">🎟️ ${metrics.activityCount} Aktivitäten</span>`);
  }
  if (metrics.averageDailyBudget) {
    items.push(`<span class="travel-metric">💶 Ø €${formatCurrency(metrics.averageDailyBudget)}</span>`);
  }

  return items.length ? items.join('') : '<span class="travel-text-muted">Noch keine Kennzahlen verfügbar.</span>';
}

function renderSegments(route) {
  const segments = route.segments ?? [];
  if (!segments.length) {
    return '<div class="travel-empty-state">Keine Segmente hinterlegt.</div>';
  }
  const rows = segments
    .map((segment) => {
      const mode = state.data.transportModes[segment.mode] ?? {};
      const operator = segment.operator ?? '–';
      const distance = segment.distanceKm ? `${segment.distanceKm.toLocaleString('de-DE')} km` : '–';
      const duration = segment.durationMinutes ? formatDuration(segment.durationMinutes) : '–';
      const price = segment.price ? `€${formatCurrency(segment.price)}` : '–';
      const carbon = segment.carbonKg ? `${segment.carbonKg.toLocaleString('de-DE')} kg` : '–';
      const frequency = segment.frequency ?? 'flexibel';
      const notes = segment.notes ? `<div class="travel-text-muted">${segment.notes}</div>` : '';
      const booking = segment.bookingUrl
        ? `<a class="travel-button travel-button--link" target="_blank" rel="noopener" href="${segment.bookingUrl}">Buchen</a>`
        : '';
      return `<tr>
        <td><span class="travel-segment-icon">${mode.icon ?? '🧭'}</span></td>
        <td><strong>${stopLabel(route, segment.from)}</strong><br/><span class="travel-text-muted">→ ${stopLabel(route, segment.to)}</span></td>
        <td>${operator}</td>
        <td>${duration}</td>
        <td>${distance}</td>
        <td>${price}</td>
        <td>${carbon}</td>
        <td>${frequency}</td>
        <td>${booking}${notes}</td>
      </tr>`;
    })
    .join('');
  return `<table class="travel-table travel-table--segments">
    <thead><tr><th>Modus</th><th>Strecke</th><th>Operator</th><th>Dauer</th><th>Distanz</th><th>Kosten</th><th>CO₂</th><th>Takt</th><th>Hinweise</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function renderStopList(route, stops) {
  if (!hasDocument) return;
  const list = document.getElementById('travel-stop-list');
  list.innerHTML = '';
  stops.forEach((stop) => {
    const li = document.createElement('li');
    li.className = 'travel-stop-item';
    const coords = formatCoordinates(stop.coordinates);
    const isSelected = stop.selected ?? true;
    const rating = stop.rating
      ? `<span class="travel-stop__rating">⭐ ${stop.rating.toFixed(1)}${stop.reviewCount ? ` (${stop.reviewCount.toLocaleString('de-DE')})` : ''}</span>`
      : '';
    const categories = (Array.isArray(stop.category) ? stop.category : stop.category ? [stop.category] : [])
      .map((cat) => `<span>${cat}</span>`)
      .join('');
    const address = stop.address
      ? `<div class="travel-text-muted">${[stop.address.street, stop.address.city, stop.address.country].filter(Boolean).join(', ')}</div>`
      : '';
    const hours = stop.openingHours ? `<div class="travel-text-muted">🕒 ${stop.openingHours}</div>` : '';
    const highlights = stop.popularFor?.length ? `<div class="travel-stop__highlights">💡 ${stop.popularFor.join(' • ')}</div>` : '';
    const tips = stop.tips?.length ? `<div class="travel-stop__tips">⚑ ${stop.tips.join(' • ')}</div>` : '';
    const timezone = stop.timezone ? `<div class="travel-text-muted">🕰️ ${stop.timezone}</div>` : '';
    const contactParts = [];
    if (stop.contact?.phone) contactParts.push(`📞 ${stop.contact.phone}`);
    if (stop.contact?.email) contactParts.push(`<a href="mailto:${stop.contact.email}">${stop.contact.email}</a>`);
    if (stop.contact?.instagram) contactParts.push(`<a target="_blank" rel="noopener" href="${stop.contact.instagram}">Instagram</a>`);
    if (stop.website) contactParts.push(`<a target="_blank" rel="noopener" href="${stop.website}">${shortenUrl(stop.website)}</a>`);
    const contact = contactParts.length ? `<div class="travel-stop__contact">${contactParts.join(' · ')}</div>` : '';
    const services = [];
    if (stop.services?.transport?.length) services.push(`🚍 ${stop.services.transport.join(', ')}`);
    if (stop.services?.amenities?.length) services.push(`✨ ${stop.services.amenities.join(', ')}`);
    const servicesHtml = services.length ? `<div class="travel-stop__services">${services.join('<br/>')}</div>` : '';
    const knowledge = stop.knowledge
      ? Object.values(stop.knowledge)
          .filter(Boolean)
          .map((entry) => `<li>${entry}</li>`)
          .join('')
      : '';
    const knowledgeHtml = knowledge ? `<ul class="travel-stop__knowledge">${knowledge}</ul>` : '';
    const photo = stop.photos?.[0]?.url
      ? `<figure class="travel-stop__photo"><img src="${stop.photos[0].url}" alt="${stop.name}" loading="lazy"/></figure>`
      : '';
    const description = stop.description ? `<p>${stop.description}</p>` : '';

    const content = `
      ${photo}
      <div class="travel-stop__info">
        <div class="travel-stop__headline">
          <strong>${stop.name}</strong>
          ${rating}
        </div>
        ${categories ? `<div class="travel-stop__chips">${categories}</div>` : ''}
        <div class="travel-text-muted">Koordinaten: ${coords}</div>
        ${address}
        ${timezone}
        ${hours}
        ${description}
        ${highlights}
        ${tips}
        ${contact}
        ${servicesHtml}
        ${knowledgeHtml}
      </div>`;

    if (route.source === 'custom') {
      li.innerHTML = `
        <label class="travel-stop-toggle">
          <input type="checkbox" ${isSelected ? 'checked' : ''} data-stop-id="${stop.id}" />
          <div class="travel-stop">${content}</div>
        </label>`;
    } else {
      li.innerHTML = `<div class="travel-stop">${content}</div>`;
    }
    list.appendChild(li);
  });

  if (route.source === 'custom') {
    list.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      checkbox.addEventListener('change', () => {
        const stopId = checkbox.getAttribute('data-stop-id');
        toggleStopSelection(route.id, stopId, checkbox.checked);
      });
    });
  }
}

function renderFlightList(route, flights) {
  if (!hasDocument) return;
  const list = document.getElementById('travel-flight-list');
  list.innerHTML = '';
  if (!flights.length) {
    list.innerHTML = '<li class="travel-stop-item">Keine Flüge hinterlegt.</li>';
    return;
  }
  flights.forEach((flight) => {
    const li = templates.flightRow.content.firstElementChild.cloneNode(true);
    const depart = formatDateTime(flight.departure);
    const arrive = formatDateTime(flight.arrival);
    const cabin = flight.cabinClass ? `Kabine: ${flight.cabinClass}` : '';
    const seat = flight.seatInfo ? `Sitz-Tipp: ${flight.seatInfo}` : '';
    const aircraft = flight.aircraft ? `Flugzeug: ${flight.aircraft}` : '';
    const baggage = flight.baggage
      ? `Gepäck: Hand ${flight.baggage.carryOn ?? '–'}${flight.baggage.checked ? ` · Aufgabe ${flight.baggage.checked}` : ''}`
      : '';
    const carbon = flight.carbonKg ? `CO₂: ${flight.carbonKg.toLocaleString('de-DE')} kg` : '';
    const distance = flight.distanceKm ? `Distanz: ${flight.distanceKm.toLocaleString('de-DE')} km` : '';
    const onTime = flight.onTimePerformance ? `Pünktlichkeit: ${flight.onTimePerformance}` : '';
    const terminalInfo = [flight.fromTerminal ? `Abflug ${flight.fromTerminal}` : '', flight.toTerminal ? `Ankunft ${flight.toTerminal}` : '']
      .filter(Boolean)
      .join(' · ');
    li.innerHTML = `
      <strong>${flight.airline} ${flight.flightNumber}</strong>
      <div>${stopLabel(route, flight.fromStopId)} → ${stopLabel(route, flight.toStopId)}</div>
      <div class="travel-text-muted">${depart} – ${arrive} · ${formatDuration(flight.durationMinutes)} · €${formatCurrency(flight.price)}</div>
      <div class="travel-text-muted">${[cabin, aircraft, seat].filter(Boolean).join(' · ')}</div>
      <div class="travel-text-muted">${[baggage, carbon, distance, onTime].filter(Boolean).join(' · ')}</div>
      ${terminalInfo ? `<div class="travel-text-muted">${terminalInfo}</div>` : ''}
      ${flight.notes ? `<div class="travel-text-muted">Hinweis: ${flight.notes}</div>` : ''}
      ${flight.bookingUrl ? `<a class="travel-button travel-button--secondary" target="_blank" rel="noopener" href="${flight.bookingUrl}">Buchen</a>` : ''}
    `;
    list.appendChild(li);
  });
}

function renderCostRows(items) {
  if (!hasDocument) return;
  const tbody = document.getElementById('travel-cost-table');
  tbody.innerHTML = '';
  items.forEach((item) => {
    const row = templates.costRow.content.firstElementChild.cloneNode(true);
    row.innerHTML = `
      <td>${item.category}</td>
      <td>€${formatCurrency(item.estimate ?? 0)}</td>
      <td>${item.notes ?? ''}</td>`;
    tbody.appendChild(row);
  });
}

function renderLodging(lodging) {
  if (!lodging?.length) {
    return '<div class="travel-empty-state">Keine Unterkünfte hinterlegt.</div>';
  }
  return `<ul class="travel-flight-list">${lodging
    .map((stay) => `
      <li class="travel-flight-item">
        <strong>${stay.name}</strong>
        <div>${stay.checkIn ?? '?'} → ${stay.checkOut ?? '?'}${stay.nights ? ` · ${stay.nights} Nächte` : ''}</div>
        <div class="travel-text-muted">${stay.address ?? ''}</div>
        <div class="travel-text-muted">Zimmer: ${stay.roomType ?? 'n/a'} · €${formatCurrency(stay.pricePerNight ?? 0)}/Nacht</div>
        ${stay.rating ? `<div class="travel-text-muted">⭐ ${stay.rating.toFixed(1)} (${stay.reviewCount?.toLocaleString('de-DE') ?? '–'} Bewertungen)</div>` : ''}
        ${stay.amenities?.length ? `<div class="travel-text-muted">Ausstattung: ${stay.amenities.join(', ')}</div>` : ''}
        ${stay.contact ? `<div class="travel-text-muted">Kontakt: ${stay.contact.phone ?? ''} ${stay.contact.email ? `· <a href="mailto:${stay.contact.email}">${stay.contact.email}</a>` : ''}</div>` : ''}
        ${stay.images?.[0]?.url ? `<figure class="travel-tile__photo"><img src="${stay.images[0].url}" alt="${stay.name}" loading="lazy"/></figure>` : ''}
        ${stay.website ? `<a class="travel-button travel-button--secondary" target="_blank" rel="noopener" href="${stay.website}">Website</a>` : ''}
      </li>`)
    .join('')}</ul>`;
}

function renderFood(food) {
  if (!food?.length) {
    return '<div class="travel-empty-state">Keine Restaurants hinterlegt.</div>';
  }
  return `<ul class="travel-flight-list">${food
    .map((item) => `
      <li class="travel-flight-item">
        <strong>${item.name}</strong>
        <div>${item.type ?? ''}</div>
        <div class="travel-text-muted">${item.address ?? ''}</div>
        <div class="travel-text-muted">Öffnungszeiten: ${item.openingHours ?? 'n/a'} · Preis: ${item.priceRange ?? 'n/a'}</div>
        ${item.specialties ? `<div class="travel-text-muted">Lieblingsgerichte: ${item.specialties.join(', ')}</div>` : ''}
        ${item.mustTry?.length ? `<div class="travel-text-muted">Must Try: ${item.mustTry.join(', ')}</div>` : ''}
        ${item.reservation ? `<div class="travel-text-muted">Reservierung: ${item.reservation}</div>` : ''}
        ${item.contact?.phone ? `<div class="travel-text-muted">📞 ${item.contact.phone}</div>` : ''}
        ${item.contact?.instagram ? `<div class="travel-text-muted"><a target="_blank" rel="noopener" href="${item.contact.instagram}">Instagram</a></div>` : ''}
        ${item.images?.[0]?.url ? `<figure class="travel-tile__photo"><img src="${item.images[0].url}" alt="${item.name}" loading="lazy"/></figure>` : ''}
        ${item.website ? `<a class="travel-button travel-button--secondary" target="_blank" rel="noopener" href="${item.website}">Website</a>` : ''}
      </li>`)
    .join('')}</ul>`;
}

function renderActivities(activities) {
  if (!activities?.length) {
    return '<div class="travel-empty-state">Keine Aktivitäten hinterlegt.</div>';
  }
  return `<ul class="travel-flight-list">${activities
    .map((activity) => `
      <li class="travel-flight-item">
        <strong>${activity.title}</strong>
        <div class="travel-text-muted">Dauer: ${activity.durationHours ?? '?'} h · €${formatCurrency(activity.price ?? 0)}</div>
        <div class="travel-text-muted">Schwierigkeit: ${activity.difficulty ?? 'n/a'} · Gruppe: ${activity.groupSize ?? 'n/a'}</div>
        ${activity.meetingPoint ? `<div class="travel-text-muted">Treffpunkt: ${activity.meetingPoint}</div>` : ''}
        ${activity.gear?.length ? `<div class="travel-text-muted">Ausrüstung: ${activity.gear.join(', ')}</div>` : ''}
        ${activity.included?.length ? `<div class="travel-text-muted">Inklusive: ${activity.included.join(', ')}</div>` : ''}
        ${activity.notes ? `<div class="travel-text-muted">Hinweis: ${activity.notes}</div>` : ''}
        ${activity.website ? `<a class="travel-button travel-button--secondary" target="_blank" rel="noopener" href="${activity.website}">Provider</a>` : ''}
      </li>`)
    .join('')}</ul>`;
}

function stopLabel(route, stopId) {
  return route.stops?.find((stop) => stop.id === stopId)?.name ?? stopId;
}

function shortenUrl(url) {
  try {
    const host = new URL(url).hostname;
    return host.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
}

function formatCoordinates(coordinates) {
  if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
    return '—';
  }
  return `${coordinates.lat.toFixed(2)}, ${coordinates.lng.toFixed(2)}`;
}

function renderCustomEditor(route) {
  const meta = route.meta ?? {};
  return `
    <section class="travel-detail__editor">
      <h3>Eigene Route bearbeiten</h3>
      <label>Routenname
        <input type="text" value="${route.name}" data-editor="name" />
      </label>
      <label>Kurzbeschreibung
        <textarea data-editor="summary">${route.summary ?? ''}</textarea>
      </label>
      <label>Tempo
        <input type="text" value="${meta.pace ?? ''}" data-editor="pace" />
      </label>
      <label>Kostenschätzung (€)
        <input type="number" value="${meta.costEstimate ?? 0}" data-editor="cost" />
      </label>
      <label>Eigene Notiz zur Route
        <textarea data-editor="notes">${route.notes ?? ''}</textarea>
      </label>
      <button class="travel-button" data-editor="save">Änderungen speichern</button>
    </section>`;
}

function findRoute(routeId) {
  return (
    state.customRoutes.find((r) => r.id === routeId) ||
    state.curatedRoutes.find((r) => r.id === routeId)
  );
}

function addCustomRouteFromCurated(routeId) {
  const original = state.curatedRoutes.find((r) => r.id === routeId);
  if (!original) return;
  const copy = JSON.parse(JSON.stringify(original));
  copy.id = `custom-${Date.now()}`;
  copy.name = `${original.name} (Kopie)`;
  copy.source = 'custom';
  copy.stops = copy.stops.map((stop) => ({ ...stop, selected: true }));
  state.customRoutes.push(copy);
  persistCustomRoutes();
  selectFilter('custom');
  renderRoutes();
  selectRoute(copy.id, 'custom');
}

function deleteCustomRoute(routeId) {
  state.customRoutes = state.customRoutes.filter((r) => r.id !== routeId);
  persistCustomRoutes();
  renderRoutes();
  const fallback = state.customRoutes[0] || state.curatedRoutes[0];
  if (fallback) {
    selectRoute(fallback.id, fallback.source ?? 'curated');
  } else {
    dom.detail.innerHTML = '<div class="travel-empty-state">Keine Route ausgewählt.</div>';
    clearMapLayers();
  }
}

function toggleStopSelection(routeId, stopId, selected) {
  const route = state.customRoutes.find((r) => r.id === routeId);
  if (!route) return;
  route.stops = route.stops.map((stop) =>
    stop.id === stopId ? { ...stop, selected } : stop
  );
  persistCustomRoutes();
  selectRoute(routeId, 'custom');
}

function renderGallery() {
  if (!dom.gallery) return;
  if (!state.data.gallery?.length) return;
  dom.gallery.innerHTML = state.data.gallery
    .map((item) => `
      <a href="${item.sourceUrl}" target="_blank" rel="noopener">
        <img src="${item.image}" alt="${item.caption}" loading="lazy" />
      </a>`)
    .join('');
}

function renderEvents() {
  if (!dom.events) return;
  if (!state.data.events?.length) return;
  dom.events.innerHTML = state.data.events
    .map((event) => `
      <li>
        <time>${event.date}</time>
        <div><strong>${event.title}</strong> · ${event.location}</div>
        <a class="travel-button travel-button--secondary" href="${event.website}" target="_blank" rel="noopener">Website</a>
      </li>`)
    .join('');
}

function renderTags() {
  if (!dom.tagList) return;
  dom.tagList.innerHTML = '';
  state.data.tagLibrary.forEach((tag) => {
    const button = document.createElement('button');
    button.textContent = tag.label;
    button.setAttribute('type', 'button');
    button.setAttribute('data-tag', tag.id);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => {
      if (state.activeTags.has(tag.id)) {
        state.activeTags.delete(tag.id);
        button.setAttribute('aria-pressed', 'false');
      } else {
        state.activeTags.add(tag.id);
        button.setAttribute('aria-pressed', 'true');
      }
      renderRoutes();
    });
    dom.tagList.appendChild(button);
  });
}

function setupFilterChips() {
  dom.chipButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-filter');
      selectFilter(filter);
    });
  });
}

function selectFilter(filter) {
  state.filter = filter;
  dom.chipButtons.forEach((btn) => {
    const isActive = btn.getAttribute('data-filter') === filter;
    btn.setAttribute('aria-selected', String(isActive));
  });
  renderRoutes();
}

function setupSearch() {
  dom.search.addEventListener('input', () => {
    state.searchTerm = dom.search.value.trim();
    renderRoutes();
  });
}

function setupMarkdown() {
  const stored = localStorage.getItem(NOTES_KEY);
  if (stored) {
    dom.markdownInput.value = stored;
    dom.markdownPreview.innerHTML = markdownToHtml(stored);
  }
  dom.markdownRender.addEventListener('click', () => {
    const value = dom.markdownInput.value;
    dom.markdownPreview.innerHTML = markdownToHtml(value);
    localStorage.setItem(NOTES_KEY, value);
  });
  dom.markdownClear.addEventListener('click', () => {
    dom.markdownInput.value = '';
    dom.markdownPreview.innerHTML = '';
    localStorage.removeItem(NOTES_KEY);
  });
}

function markdownToHtml(md) {
  let html = md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a target="_blank" rel="noopener" href="$2">$1</a>');
  html = html.replace(/^\s*[-*] (.*)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  html = html.replace(/\n\n+/g, '</p><p>');
  return html ? `<p>${html}</p>` : '';
}

function setupPanelToggle() {
  if (!dom.panelToggle) return;
  dom.panelToggle.addEventListener('click', () => {
    const hidden = dom.panel?.getAttribute('data-hidden') === 'true';
    dom.panel?.setAttribute('data-hidden', hidden ? 'false' : 'true');
    dom.panelToggle?.setAttribute('aria-expanded', hidden ? 'true' : 'false');
  });
}

function activateMapLayer(route) {
  if (!mapState.map) return;
  clearMapLayers();
  const layer = buildRouteLayer(route);
  mapState.layers.set(route.id, layer);
  layer.addTo(mapState.map);
  const bounds = collectBounds(layer);
  if (bounds) {
    mapState.map.fitBounds(bounds, { padding: [40, 40] });
  }
}

function clearMapLayers() {
  mapState.layers.forEach((layer) => {
    layer.remove();
  });
  mapState.layers.clear();
}

function buildRouteLayer(route) {
  const group = L.layerGroup();
  const stops = new Map(route.stops.map((stop) => [stop.id, stop]));
  route.stops
    .filter((stop) => stop.selected ?? true)
    .forEach((stop) => {
      const marker = L.marker([stop.coordinates.lat, stop.coordinates.lng], { icon: buildStopIcon(stop) });
      marker.bindPopup(buildStopPopup(route, stop));
      group.addLayer(marker);
    });

  (route.segments ?? []).forEach((segment) => {
    const from = stops.get(segment.from);
    const to = stops.get(segment.to);
    if (!from || !to) return;
    if ((from.selected === false) || (to.selected === false)) return;
    const mode = state.data.transportModes[segment.mode] ?? state.data.transportModes.drive;
    const line = L.polyline(
      [
        [from.coordinates.lat, from.coordinates.lng],
        [to.coordinates.lat, to.coordinates.lng],
      ],
      {
        color: mode.color,
        weight: 4,
        dashArray: mode.dashArray ?? undefined,
        opacity: 0.9,
      }
    );
    const tooltipBits = [
      `${mode.icon ?? ''} ${mode.label ?? segment.mode}`.trim(),
      segment.operator ?? '',
      segment.distanceKm ? `${segment.distanceKm.toLocaleString('de-DE')} km` : '',
      segment.durationMinutes ? formatDuration(segment.durationMinutes) : '',
      segment.carbonKg ? `${segment.carbonKg.toLocaleString('de-DE')} kg CO₂e` : '',
    ].filter(Boolean);
    line.bindTooltip(tooltipBits.join(' · '));
    group.addLayer(line);
  });

  return group;
}

function buildStopIcon(stop) {
  const iconEmoji = {
    airport: '✈️',
    bus: '🚌',
    hotel: '🛏️',
    trail: '🥾',
    beach: '🏖️',
    town: '🏘️',
    poi: '📍',
    food: '🍽️',
  };
  const emoji = iconEmoji[stop.type] ?? '📍';
  return L.divIcon({
    className: 'travel-map-icon',
    html: `<span>${emoji}</span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });
}

function buildStopPopup(route, stop) {
  const lines = [
    `<strong>${stop.name}</strong>`,
    stop.description ?? '',
    stop.rating ? `⭐ ${stop.rating.toFixed(1)}${stop.reviewCount ? ` (${stop.reviewCount.toLocaleString('de-DE')})` : ''}` : '',
    stop.address?.street ? `${stop.address.street}` : '',
    stop.address?.city ? `${stop.address.city}` : '',
    stop.openingHours ? `Öffnungszeiten: ${stop.openingHours}` : '',
    stop.popularFor?.length ? `Beliebt für: ${stop.popularFor.join(', ')}` : '',
    stop.tips?.length ? `Tipps: ${stop.tips.join(' • ')}` : '',
    stop.services?.amenities?.length ? `Ausstattung: ${stop.services.amenities.join(', ')}` : '',
    stop.services?.transport?.length ? `Anbindung: ${stop.services.transport.join(', ')}` : '',
    stop.contact?.phone ? `Telefon: ${stop.contact.phone}` : '',
    stop.contact?.email ? `E-Mail: ${stop.contact.email}` : '',
    stop.contact?.instagram ? `<a target="_blank" rel="noopener" href="${stop.contact.instagram}">Instagram</a>` : '',
    stop.website ? `<a target="_blank" rel="noopener" href="${stop.website}">${shortenUrl(stop.website)}</a>` : '',
  ].filter(Boolean);
  if (route.source === 'custom') {
    lines.push(stop.selected === false ? '<span class="travel-badge-warning">Derzeit deaktiviert</span>' : '');
  }
  const photo = stop.photos?.[0]?.url ? `<div><img class="travel-popup-photo" src="${stop.photos[0].url}" alt="${stop.name}" loading="lazy"/></div>` : '';
  return `${photo}${lines.join('<br/>')}`;
}

function collectBounds(layer) {
  const points = [];
  layer.eachLayer((child) => {
    if (typeof child.getLatLng === 'function') {
      points.push(child.getLatLng());
    } else if (typeof child.getLatLngs === 'function') {
      const latLngs = child.getLatLngs();
      (Array.isArray(latLngs) ? latLngs : [latLngs]).forEach((item) => {
        if (Array.isArray(item)) {
          item.forEach((latlng) => points.push(latlng));
        } else {
          points.push(item);
        }
      });
    }
  });
  if (!points.length) return null;
  return L.latLngBounds(points);
}

function formatCurrency(value) {
  return Number(value).toLocaleString('de-DE');
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return 'n/a';
  if (minutes < 90) return `${minutes} min`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} h`;
}

function formatDateTime(value) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function tagLabel(tagId) {
  return state.data.tagLibrary.find((tag) => tag.id === tagId)?.label ?? tagId;
}

function addMeta(container, label, value) {
  const dt = document.createElement('dt');
  dt.textContent = label;
  const dd = document.createElement('dd');
  dd.textContent = value;
  container.append(dt, dd);
}

function buildCreateCustomButton() {
  const wrapper = document.createElement('div');
  wrapper.className = 'travel-card travel-empty-state';
  wrapper.innerHTML = `
    <p>Eigene Route hinzufügen</p>
    <button class="travel-button" type="button">Leere Route erstellen</button>`;
  wrapper.querySelector('button').addEventListener('click', () => {
    createBlankRoute();
  });
  return wrapper;
}

function createBlankRoute() {
  const template = state.data.templates?.blankRoute;
  if (!template) return;
  const copy = JSON.parse(JSON.stringify(template));
  copy.id = `custom-${Date.now()}`;
  copy.source = 'custom';
  copy.name = 'Meine neue Route';
  state.customRoutes.push(copy);
  persistCustomRoutes();
  renderRoutes();
  selectRoute(copy.id, 'custom');
}

function loadCustomRoutes() {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((route) => ({ ...route, source: 'custom' })) : [];
  } catch (error) {
    console.warn('Konnte Custom-Routen nicht laden', error);
    return [];
  }
}

function persistCustomRoutes() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state.customRoutes));
}

if (hasDocument) {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.matches('[data-editor="save"]')) {
      const editor = target.closest('.travel-detail__editor');
      if (!editor) return;
      const route = state.customRoutes.find((r) => r.id === state.selectedRouteId);
      if (!route) return;
      const values = editor.querySelectorAll('[data-editor]');
      values.forEach((input) => {
        const key = input.getAttribute('data-editor');
        if (!key || key === 'save') return;
        const value = input.value;
        if (key === 'name') route.name = value;
        if (key === 'summary') route.summary = value;
        if (key === 'pace') {
          route.meta = route.meta ?? {};
          route.meta.pace = value;
        }
        if (key === 'cost') {
          route.meta = route.meta ?? {};
          route.meta.costEstimate = Number(value) || 0;
        }
        if (key === 'notes') {
          route.notes = value;
        }
      });
      persistCustomRoutes();
      renderRoutes();
      selectRoute(route.id, 'custom');
    }
  });

  window.addEventListener('resize', () => {
    if (!mapState.map) return;
    mapState.map.invalidateSize();
  });
}

// Export für Tests (optional)
export { init, state, mapState, buildRouteLayer, loadCustomRoutes, markdownToHtml };
