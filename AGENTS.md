# agents.md – Leitplanken für das SvelteKit-GitHub-Pages-Projekt

## Zweck
- Dieses Repository enthält ein SvelteKit-Projekt, das als **statisch generierte Site auf GitHub Pages** veröffentlicht wird.
- Der UI-Stack besteht aus **Tailwind CSS** und **Flowbite Svelte**.

## GitHub-Pages-Regeln & Limits (Kurzreferenz)
- Nur statische Dateien werden ausgeliefert; kein serverseitiger Code erlaubt.
- Veröffentlichte Site ≤ 1 GB.
- Empfohlene Größe des Quell-Repositorys ≤ 1 GB.
- Soft-Limit: 100 GB Bandbreite pro Monat.
- Soft-Limit: 10 Builds pro Stunde (ausgenommen reine Actions-Workflows zum Bauen & Publizieren).
- `.nojekyll` bereitstellen oder Jekyll ausdrücklich deaktivieren, wenn kein Jekyll-Build verwendet wird.
- Custom-Domain nur mit korrekter DNS- und Pages-Konfiguration (inkl. `CNAME`, falls nötig).

## Technischer Stack & Befehle
- Node.js 20 mit npm als Package-Manager.
- Standardbefehle:
  - `npm run dev` – Lokaler Entwicklungsserver mit automatischem Reload.
  - `npm run build` – Statischer Produktions-Build mit `@sveltejs/adapter-static`.
  - `npm run preview` – Lokale Vorschau des statischen Builds.
- Für Karten- und Reise-Demos existiert eine Beispiel-Route (`travel-routes/data/routes/example-andes-pacific.json`),
  die das tagesbasierte Slider-Schema samt Mobilitäts- und Kartenpunkten dokumentiert. Neue Funktionen sollten sich an
  diesem Format orientieren.
- GitHub-Actions-Workflow (`.github/workflows/pages.yml`):
  - Trigger: Push auf den Standard-Branch (z. B. `main`).
  - Schritte: `actions/setup-node`, `npm ci`, `npm run build`.
  - Artefakt: Upload des statischen Ausgabeverzeichnisses mit `actions/upload-pages-artifact`.
  - Deployment: Veröffentlichung über `actions/deploy-pages` auf GitHub Pages (setzt `.nojekyll`).

## Agenten-Verhaltensregeln (Self-Referential)
- Jeder Agent, der dieses Repository verändert, muss nach der Änderung prüfen, ob agents.md aktualisiert werden muss und dies unmittelbar tun.
- Jeder Agent muss zu Beginn seiner Ausführung die vollständige `agents.md` lesen.
- Am Ende jeder Ausführung muss geprüft werden, ob durch die vorgenommenen Änderungen Informationen in `agents.md` veraltet sind (z. B. Stack-Anpassungen, neue Deploy-Strategie, veränderte Limits oder Workflows) und die Datei ggf. sofort aktualisiert werden.
- Änderungen an Build- oder Deployment-Logik, am Deployment-Ziel, am Base-Path oder am Core-Stack (SvelteKit/Tailwind/Flowbite) dürfen **nur** zusammen mit einem aktualisierten `agents.md` committed werden.
- Prüfe bei neuen oder angepassten Funktionalitäten stets die Original-Dokumentation der verwendeten Libraries (z. B. MapLibre, Flowbite, Tailwind), bevor du Code übernimmst oder APIs nutzt.
- Wenn du Aufrufe oder Parameter veränderst, lies die jeweils aktuelle Referenz (MapLibre, Flowbite, Tailwind, Vite etc.), um sicherzustellen, dass Methodennamen, Optionen und Defaults exakt dem veröffentlichten Stand entsprechen.
- Wird ausdrücklich um Bugfixing oder eine Korrektur gebeten, führe Builds und relevante Testläufe mit maximaler Verbosität aus (z. B. `npm run build -- --debug --verbose`), damit Logs für das Debugging vollständig vorliegen.
- Diese Selbstverpflichtung ist Teil dieser Datei und dokumentiert die Pflicht zur eigenen Aktualisierung (rekursive Dokumentation).

## Do & Don't für GitHub Pages
- **Do**
  - Statischen Output klein halten; unnötige Dateien vermeiden.
  - Bei neuen Routen den Base-Path lokal und auf Pages testen.
  - Custom-Domain-Setup dokumentieren, sobald eine Domain hinterlegt ist.
- **Don't**
  - Keine serverseitigen APIs oder Laufzeit-Backends in SvelteKit integrieren.
  - Keine Abhängigkeiten einführen, die eine Node-Laufzeit auf dem Server voraussetzen.
  - Das GitHub-Pages-Build-Limit durch viele kurz aufeinanderfolgende Pushes ausreizen.

## Initiale Interaktion mit Nutzern
- Vor Projektstart aktiv nach GitHub-Username, Repository-Namen, GitHub-Pages-Typ (User/Org vs. Projekt-Page) und Custom-Domain fragen.
- Die abgefragten Werte intern merken und konsequent in allen Konfigurationen (Base-Path, Actions-Workflow, `CNAME` etc.) nutzen.
- Die Antworten der Nutzer:innen bestimmen die Konfiguration des Deployments.

## MapLibre-Referenzseite für die Chile-Reiseplanung
- Die statische Referenz lebt in `travel-routes/chile-map.html` und zieht ihre Logik aus `travel-routes/chile-map.js`. Die Seite
  ist ohne Build-Tooling lauffähig, nutzt MapLibre per CDN und lädt die Daten über `travel-routes/travel-routes-data.json`.
- Die Funktionen `initMap`, `addGeoJsonSource`, `addRouteLayer`, `addPoiLayer` und `fitMapToData` sind dort bewusst modular
  implementiert, damit weitere Features sie leicht übernehmen können.
- Anpassungen am GeoJSON-Aufbau oder der MapLibre-Konfiguration müssen von Tests begleitet werden (`travel-routes/chile-map.test.js` via `node --test travel-routes/chile-map.test.js`).
- Die Svelte-basierte Experience setzt den Karten-Slider nun immer automatisch ans Ende jeder Route. Die Logik steckt in
  `src/lib/travel/timeline-helpers.ts` und ist mit `timeline-helpers.test.ts` abgesichert – bei Anpassungen unbedingt die Tests
  anpassen und ausführen (`npm test`).
