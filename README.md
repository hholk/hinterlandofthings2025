# hinterlandofthings2025
Kleine PWA, um sich auf der Hinterland of Things 2025 zu orientieren. Offline und client-seitig. Die eigentliche PWA befindet sich nun unter `hinterland.html`. Eine neue Startseite `index.html` (login) and `landing.html` (open) bietet die Auswahl zwischen der Hinterland-Veranstaltung und dem geplanten "Universal Home" Event.

**Connection to Miele:** This content relates to ongoing work at Miele.

## Warum teilnehmen?

Als KI-Sprachmodell erkenne ich hier zahlreiche Chancen: Die Veranstaltung bietet Einblicke in neue Technologien, ermöglicht wertvolle Kontakte und inspiriert zu innovativen Ideen. Teilnehmende können voneinander lernen und gemeinsam die Zukunft gestalten.

## Login & Zugang

- **Standardpasswort:** `689i9052A.hint`
- **So wird geprüft:** Client-seitig via SHA-256 Hashvergleich, damit die PWA offline funktioniert.
- **Kompatibel:** Läuft auch auf älteren iOS-/Android-Browsern ohne nativen `TextEncoder` – wir wandeln die Zeichen nun selbst in UTF-8 um.
- **Passwort ändern:**
  1. `PASSWORD="DeinNeuesPasswort" node generate_credentials.js`
  2. Die generierte `credentials.js` einchecken.
- **Tipp:** Nach dem Login wird ein `auth`-Flag im `localStorage` gesetzt. Zum Abmelden einfach den lokalen Speicher für die Domain leeren.
- **Neu:** Nach erfolgreicher Anmeldung wird direkt auf der Passwortseite das komplette Unterseiten-Menü angezeigt. Die Daten liegen in `experience-pages.js`, die Darstellung übernimmt `experience-ui.js` (inkl. VanillaTilt für die Glas-Parallax-Effekte).

## UI-Richtlinien

- Die Passwortseite definiert Farben, Glas-Optik und Typografie. Alle Unterseiten verwenden jetzt dieselben Box-Komponenten (`page-card`, `events-section`, `calendar-shell`).
- Headlines greifen IBM Plex Serif auf, Fließtext bleibt in IBM Plex Sans – die Einstellungen findest du zentral in `style.css`.
- Für neue Module lohnt es sich, bestehende Klassen zu erweitern statt neue Varianten zu erfinden. So bleibt das Look & Feel konsistent.

## Neu: Travel Experience (Chile)

- Unter `travel-routes/index.html` findest du eine komplett modulare Reiserouten-Seite. Die Daten liegen in `travel-routes/travel-routes-data.json` und lassen sich über das Hilfsskript `travel-routes/build_data.py` bequem pflegen.
- Besucher:innen können kuratierte Vorschläge auf die Karte legen, Flüge und Kosten prüfen und die Routen als eigene Entwürfe im Local Storage abspeichern.
- Die Leaflet-Karte nutzt transport-spezifische Farben (Flug, Bus, Fähre etc.), Pop-ups zeigen Adressen, Öffnungszeiten und Tipps ähnlich wie bei Google Maps.
- Eigene Notizen werden per Markdown gerendert und ebenfalls lokal gespeichert – ideal für spontane Ergänzungen zu Unterkünften oder Restaurants.
- Das Layout der Travel-Experience ist jetzt ein responsives Raster: Links die scrollbare Übersicht, rechts eine großflächige Karte (mobil als Einstieg), darunter die Detailansicht mit View-Toggle.
