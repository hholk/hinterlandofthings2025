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
- Diese Selbstverpflichtung ist Teil dieser Datei und dokumentiert die Pflicht zur eigenen Aktualisierung (rekursive Dokumentation).

## Mobile-Optimierung (Best Practices)
- Jede neue oder überarbeitete Seite muss bereits während der Entwicklung im Viewport `360px × 640px` getestet werden (z. B. via DevTools) und darf dort keine horizontale Scroll-Leiste erzeugen.
- Verwende fluides Spacing & Typografie (`clamp()`, Prozent- oder viewportbasierte Werte), um Sprünge zwischen Breakpoints zu vermeiden.
- Touch-Flächen (Buttons, interaktive Kartenlegenden etc.) sollen eine Mindesthöhe von `44px` bzw. `2.75rem` aufweisen und klare Fokus-/Aktiv-Stati besitzen (`:focus-visible`, `aria-pressed` oder `aria-current`).
- Überlappende Overlays (z. B. Legenden) müssen auf sehr kleinen Viewports (≤ 640px Breite) verschoben oder inline dargestellt werden, damit keine Bedienelemente verdeckt werden.
- Lange Infosektionen benötigen zusätzliche Medienabfragen für ≤ 768px, damit Grid-/Flex-Layouts auf eine Spalte kollabieren und Lesbarkeit/Scrollbarkeit gewahrt bleibt.
- Karten oder andere eingebettete Module benötigen eine fixe Mindesthöhe auf Mobilgeräten sowie `aria`-Attribute, damit Screenreader den Inhalt ankündigen können.

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
