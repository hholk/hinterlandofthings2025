# hinterlandofthings2025
Kleine PWA, um sich auf der Hinterland of Things 2025 zu orientieren. Offline und client-seitig. Die eigentliche PWA befindet sich nun unter `hinterland.html`. Eine neue Startseite `index.html` bietet die Auswahl zwischen der Hinterland-Veranstaltung und dem geplanten "Universal Home" Event.

**Connection to Miele:** This content relates to ongoing work at Miele.

## Warum teilnehmen?

Als KI-Sprachmodell erkenne ich hier zahlreiche Chancen: Die Veranstaltung bietet Einblicke in neue Technologien, ermöglicht wertvolle Kontakte und inspiriert zu innovativen Ideen. Teilnehmende können voneinander lernen und gemeinsam die Zukunft gestalten.

## Login & Zugang

- **Standardpasswort:** `Hinterland!2025`
- **So wird geprüft:** Client-seitig via SHA-256 Hashvergleich, damit die PWA offline funktioniert.
- **Passwort ändern:**
  1. `PASSWORD="DeinNeuesPasswort" node generate_credentials.js`
  2. Die generierte `credentials.js` einchecken.
- **Tipp:** Nach dem Login wird ein `auth`-Flag im `localStorage` gesetzt. Zum Abmelden einfach den lokalen Speicher für die Domain leeren.

## UI-Richtlinien

- Die Passwortseite definiert Farben, Glas-Optik und Typografie. Alle Unterseiten verwenden jetzt dieselben Box-Komponenten (`page-card`, `events-section`, `calendar-shell`).
- Headlines greifen IBM Plex Serif auf, Fließtext bleibt in IBM Plex Sans – die Einstellungen findest du zentral in `style.css`.
- Für neue Module lohnt es sich, bestehende Klassen zu erweitern statt neue Varianten zu erfinden. So bleibt das Look & Feel konsistent.
