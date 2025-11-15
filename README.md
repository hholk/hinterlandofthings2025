# Interactive Briefing Hub (SvelteKit Edition)

Diese Version migriert das bisherige statische Setup vollständig auf [SvelteKit](https://kit.svelte.dev/).
Moderne Animationen kommen über [GSAP](https://gsap.com/) und smooth scrolling via
[Locomotive Scroll](https://locomotivemtl.github.io/locomotive-scroll/) aus der empfohlenen
JavaScript-Library-Sammlung.

## Schnellstart

```bash
npm install
npm run dev    # Entwicklungsserver
npm run build  # Produktions-Build
npm run preview
npm run test   # Vitest + jsdom
```

## GitHub Pages & Stealth Login

- **Statischer Build:** Dank `@sveltejs/adapter-static` rendert `npm run build` alle Seiten als HTML.
- **Basis-Pfad:** Deployments unter `https://<user>.github.io/<repo>` setzen `BASE_PATH=/hinterlandofthings2025` (oder nutzen das
  automatisch erkannte `GITHUB_REPOSITORY`).
- **.nojekyll:** Die Datei `static/.nojekyll` stellt sicher, dass GitHub Pages die `_app`-Assets ausliefert.
- **Stealth Login im Client:**
  - `PASSWORD_HASH` liegt weiterhin in `src/lib/utils/auth.ts`.
  - `src/lib/stores/auth.ts` prüft Cookies im Browser und steuert die Weiterleitung.
  - Die Login-Seite (`src/routes/login/+page.svelte`) verifiziert den Hash direkt im Browser und schreibt ein Session-Cookie.
  - Kommentare in den Dateien erklären Einsteiger:innen jeden Schritt.

## Inhaltliche Module

| Bereich | Datei | Hinweis |
| --- | --- | --- |
| Landing Page | `src/routes/+page.svelte` | Hero, Kartenraster & Fahrplan-Übersicht |
| Experiences | `src/routes/experiences/[slug]/+page.svelte` | Platzhalter pro Modul, Daten aus `src/lib/data/experiences.ts` |
| Fahrplan | `src/lib/components/ScheduleTable.svelte` | Lädt Markdown-Slots aus `src/lib/data/timeslots.json` |

## Tests & Qualitätssicherung

- `npm run test` führt unter anderem `src/lib/utils/auth.test.ts`, `src/lib/stores/auth.test.ts` und `config/base-path.test.ts` aus,
  damit Login und GitHub-Pages-Pfad stabil bleiben.
- `npm run lint` startet `svelte-check` und synchronisiert das SvelteKit-Projekt.

## Passwort ändern

1. Neues Passwort hashen (z. B. in Node):
   ```js
   import crypto from 'node:crypto';
   const hash = crypto.createHash('sha256').update('DEIN_NEUES_PASSWORT').digest('hex');
   console.log(hash);
   ```
2. Den Hash in `PASSWORD_HASH` ersetzen.

## Migration weiterer Inhalte

- Die bisherigen HTML-Dateien können nach und nach in `src/routes` übertragen werden.
- Das Daten-Array in `src/lib/data/experiences.ts` steuert Navigationspunkte sowie die Detailseiten.
- Kommentare helfen Einsteiger:innen beim Ergänzen neuer Module.
