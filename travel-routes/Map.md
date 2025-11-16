# Chile Travel Experience – Map UI & Feature Guide

Diese Datei fasst die sichtbare Gestaltung der Standalone-Karte (`travel-routes/chile-map.html`) und die dahinterliegende Funktionalität (`travel-routes/chile-map.js`) zusammen. Nutze sie als Nachschlagewerk, wenn du Styles oder MapLibre-Features erweitern möchtest.

## UI-Eigenschaften

### Farb- und Typografie-System
- **Schrift:** `Inter`, fallback `system-ui` → sorgt für ein modernes Sans-Serif-Feeling im gesamten Dokument.
- **Farbvariablen:**
  - `--bg` `#0f172a` (Seitenhintergrund mit radialem Verlauf plus Sternenhimmel-Look)
  - `--panel` `#111827`, `--panel-soft` `#1e293b` (Panel-/Card-Flächen)
  - `--text` `#f8fafc`, `--text-soft` `#cbd5f5` (Primär- und Sekundärtext)
  - `--accent` `#38bdf8` (interaktive Elemente, Auswahlrahmen)
- **Popup-Design:** dunkler Hintergrund `rgba(15, 23, 42, 0.95)`, weiche Schatten (`0 20px 55px rgba(15, 23, 42, 0.45)`), abgerundete Ecken (`0.85rem`).

### Layout
- **Page Grid:** `main` ist auf `min(1200px, 100%)` begrenzt und nutzt ein Grid mit `gap: 1.5rem`.
- **Panels:** Header & Kartenpanel besitzen halbtransparente Hintergründe, 1px-Border und großzügige Border-Radii (≥ `1.25rem`).
- **Kartenbereich:** `.map-layout` erzeugt ein zweispaltiges Grid (Map vs. Info-Sidebar). Unter 960px wechselt es auf eine Spalte.
- **Map Canvas:** Karte wird in `.map-canvas` gebettet (Box-Shadow, Polsterung) und erhält eine Toolbar (Label + `<select>`), Map-Fläche und Statusanzeige.
- **Responsive Anpassungen:**
  - Unter 960px: einspaltig, Kartenhöhe `min(60vh, 440px)`.
  - Unter 600px: geringere Außen- und Panel-Padding-Werte (`0.75rem`).

### Bedienelemente & Inhaltssidebar
- **Route Select:** `<select id="route-select">` mit Label und `aria-label` für Zugänglichkeit.
- **Status & Legende:** `<p id="map-status">` fungiert als `role="status"`; `<div id="map-legend">` wird dynamisch mit Segmentfarben gefüllt.
- **Info Cards:** Drei Cards (`route-info`, „Mobilität“, „Highlights“), jeweils mit `info-card`-Styles.
  - `#route-meta` listet Dauer, Budget usw. als Key/Value-Paare.
  - `.mode-list` zeigt Transportmodi + Kilometeranteile.
  - `.poi-list` (Ordered List) hebt max. sechs Highlights hervor.
- **POI Styling:** Items besitzen `background: var(--panel-soft)`, 0.75rem Radius und dezente Border.

## Karten-Features & Interaktionen

### Datenfluss
1. **Dataset-Laden:** `loadDataset()` lädt `travel-routes-data.json` ohne Cache (`fetch` mit `cache: 'no-store'`).
2. **Route-Detail:** `ensureRouteDetail(id)` holt Detaildateien (`data/routes/*.json`) und cached sie in `routeCache`.
3. **Transport-Modi & Legende:** `renderLegend()` baut anhand `dataset.transportModes` Farbswatches mit Icon/Label.

### MapLibre-Konfiguration
- **Raster-Quelle:** `createMapStyle()` definiert `osm`-Source mit `resolveTileTemplates()` (inkl. `{s}`-Subdomain-Support). Fallback-Tile: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`.
- **Glyphs & Sprite:** Standardglyphs `https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf`; optional `mapConfig.spriteUrl`.
- **Map Setup:** `initMap()` setzt
  - `center`: Standard `[-70.5, -30]`
  - `zoom`: Standard `4.2`
  - `maxZoom`: `10`
  - Controls: NavigationControl (ohne Kompass) und AttributionControl (kompakt)
- **Sources & Layers:**
  - `SEGMENT_SOURCE_ID` + zwei Line-Layer (durchgezogene / gestrichelte Segmente je nach `dashArray`).
  - `POI_SOURCE_ID` + Circle-Layer (`circle-radius` skaliert mit Zoom; Farben per Kategorie) + Symbol-Layer für Namen.

### Geometrie-Aufbereitung
- `buildSegmentFeatures(route, transportModes)` erzeugt FeatureCollections aus `dailySegments`, klassischen `segments/stops` oder `days.*.arrival.segments` (Fallback) inklusive Farblogik (`resolveModeAppearance`).
- `buildPoiFeatures(route)` priorisiert `route.stops`, ansonsten `day.station` + `arrival.mapPoints`.
- `calculateBounds()` sammelt alle Koordinaten eines FeatureCollections zur Bounding-Box für `fitBounds`.

### UI-Logik
- **Route-Auswahl:** Dropdown löst `selectRoute(id)` aus → lädt Details, aktualisiert Info-Panels und aktualisiert Map-Sources.
- **Statusmeldungen:** `setStatus()` informiert über Ladezustände/Fehler.
- **POI-Liste:** `renderPoiList()` limitiert auf `MAX_POI_LIST_ITEMS` (=6) und sortiert nach `order`.
- **Mobilitätsliste:** `renderModeList()` fasst Distanz & Anteil pro Transportmode zusammen.
- **Bounding Box:** `fitMapToData()` zoomt die Karte so, dass alle Segmente & POIs sichtbar sind (Padding 60px).

### Interaktionen
- **Popups:** Klicks auf Segmente oder POIs öffnen `maplibregl.Popup` ohne Close-Button; Fotos + Bildcredit werden angezeigt, falls vorhanden.
- **Cursor Feedback:** `mouseenter`/`mouseleave` auf `SEGMENT_LAYER_ID` setzen den Cursor auf `pointer` bzw. zurück.
- **Keyboard & Screenreader:**
  - `role="application"` auf `#map` für Screenreader-Kontext.
  - Info-Sidebar & Legende nutzen `aria-live="polite"`, damit Routewechsel angesagt wird.

### Performance & Caching
- `routeCache` speichert bereits geladene Detaildateien, `travelDataset` wird nur einmal geladen.
- `fetchJson()` setzt `cache: 'no-store'`, damit GitHub Pages sofort neue JSONs liefert.

## Pflegehinweise
- **Neue UI-Elemente** sollten dieselben Farbvariablen und Border-Radii nutzen, um die Glas-/Neon-Ästhetik beizubehalten.
- **Neue Routen** folgen dem Schema in `travel-routes/data/routes/example-andes-pacific.json`; stelle sicher, dass Segment- und Stop-Daten korrekt mit `normalizeCoordinate()` harmonieren.
- **Tests:** Änderungen an GeoJSON- oder MapLibre-Logik mit `node --test travel-routes/chile-map.test.js` prüfen.
