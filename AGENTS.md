# Projektleitfaden für Codex-Agent:innen

Willkommen im Hinterland-of-Things-Playground. Bitte beachte beim Arbeiten die folgenden Regeln:

## Entwicklungsumgebung
- Das Projekt basiert auf SvelteKit (Node 20, npm). Nutze `npm ci` für reproduzierbare Installationen.
- Verwende `npm run dev` für lokale Entwicklung und `npm run build` für Produktions-Builds. Das Build-Resultat landet im Ordner `build/`.
- Tests laufen mit Vitest (`npm run test`). Für Typsicherheit steht `npm run lint` bereit; bekannte Warnungen aus `flowbite-svelte` dürfen dokumentiert werden, müssen aber vor einem Release bewertet werden.

## GitHub-Pages-Deployment
- Der Workflow `.github/workflows/static.yml` baut die App mit Node 20, führt `npm ci` sowie `npm run build` aus und lädt ausschließlich `build/` hoch.
- Nach dem Build MUSS `static/.nojekyll` nach `build/.nojekyll` kopiert werden, damit GitHub Pages das `_app`-Verzeichnis nicht herausfiltert.
- Setze für Vorschauen lokal `BASE_PATH` oder `GITHUB_REPOSITORY`, um den GitHub-Pages-Basispfad zu simulieren.

## Stil- und Code-Vorgaben
- Bevorzugt sprechende Funktions- und Variablennamen. Ergänze erklärende Kommentare für Einsteiger:innen, wenn du neue Logik hinzufügst.
- Entferne Debug-Code vor dem Commit. Schreibe für neue Features mindestens einen Vitest-Case.

Weitere Hinweise findest du in der README sowie in den kommentierten Quelltexten.
