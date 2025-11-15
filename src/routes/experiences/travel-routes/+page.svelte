<script lang="ts">
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import '../../../../travel-routes/travel-routes.css';

  export let data: PageData;

  let loadError: string | null = null;
  let bootCancelled = false;
  const defaultDurationLabel = data.travel?.meta?.defaultDurationDays
    ? `${data.travel.meta.defaultDurationDays} Tage`
    : 'Mehrtagestour';

  const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

  function ensureBodyTheme() {
    if (typeof document === 'undefined') return;
    document.body.classList.add('travel-body');
  }

  function removeBodyTheme() {
    if (typeof document === 'undefined') return;
    document.body.classList.remove('travel-body');
  }

  function loadLeaflet(): Promise<void> {
    if (typeof window === 'undefined') {
      return Promise.resolve();
    }
    if ((window as typeof window & { L?: unknown }).L) {
      return Promise.resolve();
    }

    const existing = document.querySelector('script[data-leaflet]');
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener(
          'error',
          () => reject(new Error('Leaflet konnte nicht geladen werden.')),
          { once: true }
        );
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = LEAFLET_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.dataset.leaflet = 'true';
      script.addEventListener('load', () => resolve());
      script.addEventListener('error', () => reject(new Error('Leaflet konnte nicht geladen werden.')));
      document.head.appendChild(script);
    });
  }

  // Für Einsteiger:innen: Wir laden die Leaflet-Bibliothek erst im Browser,
  // damit der statische Build klein bleibt und SSR nicht ins Stolpern gerät.
  onMount(() => {
    bootCancelled = false;
    ensureBodyTheme();

    if (import.meta.env.MODE === 'test') {
      return () => {
        bootCancelled = true;
        removeBodyTheme();
      };
    }

    const boot = async () => {
      try {
        await loadLeaflet();
        if (bootCancelled) return;
        await import('../../../../travel-routes/travel-routes.js');
      } catch (error) {
        if (!bootCancelled) {
          loadError = error instanceof Error ? error.message : 'Unbekannter Fehler';
        }
      }
    };

    void boot();

    return () => {
      bootCancelled = true;
      removeBodyTheme();
    };
  });
</script>

<svelte:head>
  <title>{data.experience?.title ?? 'Chile Travel Experience'}</title>
  <meta
    name="description"
    content={
      data.experience?.description ??
        'Interaktive Chile-Routen mit editierbaren Etappen, Karten und eigener Notizfunktion.'
    }
  />
  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    integrity="sha512-sA+e2PK0FG3blwYqCCptdJOwA/6R1/pnS1AZJgYzu3n6PvJEa3TBUnIFmLnb5DxF0E2SABOeHG3H0p+0bBt5JQ=="
    crossorigin=""
  />
</svelte:head>

<section class="travel-experience" aria-labelledby="travel-experience-title">
  <header class="travel-experience__intro">
    <span aria-hidden="true" class="travel-experience__icon">{@html data.experience?.icon ?? ''}</span>
    <div>
      <h1 id="travel-experience-title">{data.experience?.title ?? 'Chile Travel Experience'}</h1>
      <p>{data.experience?.description ?? 'Modulares Toolkit für Chile-Routen.'}</p>
    </div>
  </header>

  <div class="travel-app" data-state-ready="false">
    <aside id="travel-panel" class="travel-panel" data-hidden="false" aria-label="Routenfilter">
      <header class="travel-panel__header">
        <div>
          <p class="travel-panel__eyebrow">Chile Toolkit</p>
          <h2 class="travel-panel__headline">Kuratiere deine Reise</h2>
          <p class="travel-text-muted">
            Vergleiche Vorschläge, markiere Favoriten und starte eigene Varianten in wenigen Klicks.
          </p>
        </div>
        <span class="travel-panel__badge">{defaultDurationLabel}</span>
      </header>

      <section class="travel-panel__section" aria-labelledby="travel-search-label">
        <label id="travel-search-label" class="travel-label" for="travel-search">Routen durchsuchen</label>
        <input
          id="travel-search"
          class="travel-input"
          type="search"
          placeholder="z. B. Valparaíso, Vulkane, Food"
        />
      </section>

      <section class="travel-panel__section" aria-labelledby="travel-filter-label">
        <div class="travel-panel__section-heading">
          <h3 id="travel-filter-label">Sammlungen</h3>
          <p class="travel-text-muted">Filtere nach kuratierten Vorschlägen oder deinen eigenen Entwürfen.</p>
        </div>
        <div class="travel-filter" role="tablist" aria-label="Routenquellen wählen">
          <button class="travel-chip" type="button" data-filter="curated" aria-selected="true">
            Kuratierte Routen
          </button>
          <button class="travel-chip" type="button" data-filter="custom" aria-selected="false">
            Eigene Entwürfe
          </button>
        </div>
        <div id="travel-tag-list" class="travel-tag-list" aria-label="Themen-Tags"></div>
      </section>

      <section class="travel-panel__section travel-panel__section--secondary" aria-labelledby="travel-route-list-heading">
        <div class="travel-panel__section-heading">
          <h3 id="travel-route-list-heading">Vorschläge & Kopiervorlagen</h3>
          <p class="travel-text-muted">Klicke auf „Details anzeigen“, um Karte und Planung zu aktualisieren.</p>
        </div>
        <div id="travel-route-list" class="travel-route-list" aria-live="polite">
          <div class="travel-empty-state">Routen werden geladen …</div>
        </div>
      </section>

      <section class="travel-panel__section travel-panel__section--secondary" aria-labelledby="travel-gallery-heading">
        <div class="travel-panel__section-heading">
          <h3 id="travel-gallery-heading">Fotogalerie</h3>
          <p class="travel-text-muted">Inspiration aus der Atacama, Patagonien und von Rapa Nui.</p>
        </div>
        <div id="travel-gallery" class="travel-gallery"></div>
      </section>

      <section class="travel-panel__section travel-panel__section--secondary" aria-labelledby="travel-events-heading">
        <div class="travel-panel__section-heading">
          <h3 id="travel-events-heading">Events & Festivals</h3>
          <p class="travel-text-muted">Plane besondere Termine direkt ein.</p>
        </div>
        <ul id="travel-events" class="travel-event-list"></ul>
      </section>

      <section class="travel-panel__section travel-panel__section--secondary" aria-labelledby="travel-poi-heading">
        <div class="travel-poi__header">
          <div>
            <h3 id="travel-poi-heading">POI-Merkliste</h3>
            <p class="travel-text-muted">Speichere Spots direkt für deinen Trip.</p>
          </div>
        </div>
        <div id="travel-poi-list" class="travel-poi-list"></div>
      </section>

      <section class="travel-panel__section travel-panel__section--secondary" aria-labelledby="travel-notes-heading">
        <div class="travel-panel__section-heading">
          <h3 id="travel-notes-heading">Deine Reise-Notizen</h3>
          <p class="travel-text-muted">Markdown wird live gerendert – ideal für schnelle Ideen.</p>
        </div>
        <label class="travel-label" for="travel-md">Markdown-Eingabe</label>
        <textarea
          id="travel-md"
          class="travel-input"
          rows="5"
          placeholder="## Ideen für deinen persönlichen Ablauf"
        ></textarea>
        <div class="travel-actions">
          <button id="travel-md-render" class="travel-button" type="button">Notiz aktualisieren</button>
          <button id="travel-md-clear" class="travel-button travel-button--secondary" type="button">
            Notiz leeren
          </button>
        </div>
        <div id="travel-md-preview" class="travel-markdown" aria-live="polite"></div>
      </section>
    </aside>

    <div class="travel-map-shell" aria-label="Chile-Karte">
      <button
        class="travel-panel-toggle"
        type="button"
        aria-controls="travel-panel"
        aria-expanded="true"
      >
        <span class="sr-only">Routenübersicht umschalten</span>
        ☰
      </button>
      <div id="travel-map" class="travel-map" role="presentation" aria-label="Reiseroutenkarte"></div>
    </div>

    <section id="travel-detail" class="travel-detail" aria-live="polite">
      {#if loadError}
        <div class="travel-empty-state">{loadError}</div>
      {:else}
        <div class="travel-empty-state">Wähle eine Route aus der Liste, um Details zu sehen.</div>
      {/if}
    </section>
  </div>
</section>

<template id="tpl-route-card">
  <article class="travel-card" data-route-id="">
    <header class="travel-card__header">
      <div>
        <h3 class="travel-card__title"></h3>
        <p class="travel-card__subtitle"></p>
      </div>
      <span class="travel-card__badge"></span>
    </header>
    <p class="travel-card__description"></p>
    <dl class="travel-card__meta"></dl>
    <div class="travel-card__actions"></div>
  </article>
</template>

<template id="tpl-flight-row">
  <li class="travel-flight-item"></li>
</template>

<template id="tpl-stop-item">
  <li class="travel-stop-item"></li>
</template>

<template id="tpl-cost-row">
  <tr></tr>
</template>

<style>
  .travel-experience {
    display: grid;
    gap: clamp(2rem, 4vw, 3rem);
  }

  .travel-experience__intro {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  .travel-experience__icon :global(svg) {
    width: 3rem;
    height: 3rem;
    color: #5bd1ff;
  }

  .travel-experience__intro h1 {
    margin: 0;
    font-size: clamp(2rem, 5vw, 3rem);
  }

  .travel-experience__intro p {
    margin: 0;
    color: rgba(226, 232, 240, 0.82);
    max-width: 60ch;
  }

  .travel-panel__section-heading {
    display: grid;
    gap: 0.35rem;
    margin-bottom: 0.75rem;
  }

  .travel-actions {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>
