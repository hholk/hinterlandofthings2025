# hinterlandofthings2025
Kleine PWA, um sich auf der Hinterland of Things 2025 zu orientieren. Die App läuft komplett clientseitig und funktioniert dank Service Worker offline.

## Installation

Einfach die Seite per GitHub Pages bereitstellen. Beim Laden versucht die App die Agenda automatisch von der offiziellen Website zu holen. Sollte dies scheitern, werden die Markdown Dateien aus `data/` genutzt.

## Deployment via GitHub Pages

1. Initialisiere ein neues Git-Repository oder klone dieses Repository und push es zu GitHub:
   ```bash
   git init
   git remote add origin https://github.com/<user>/<repo>.git
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
2. Aktiviere anschließend **GitHub Pages** in den Repository-Einstellungen unter **Settings → Pages**.
   Wähle den Branch (meist `main`) und als Ordner `/` aus und speichere.
3. Nach wenigen Minuten stellt GitHub eine URL wie `https://<user>.github.io/<repo>/` bereit.
   Beim Aufruf dieser Adresse wird `index.html` geladen.
4. Die PWA funktioniert auch offline, da `service-worker.js` `index.html`, CSS, JavaScript und die Beispiel-Markdowns zwischenspeichert.

## Nutzung

Beim Klick auf den Stern wird ein Slot in den persönlichen Plan übernommen. Die App funktioniert offline dank Service Worker.

Die automatisch geladenen Programmpunkte erscheinen im Backlog und können per Stern in den eigenen Zeitplan übernommen werden.
