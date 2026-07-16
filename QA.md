# QA-Checkliste V3

## Automatisch geprüft

- JavaScript-Syntax von `app.js`, `guide-data.js`, `config.js` und `sw.js`
- Manifest-JSON
- Startscreen rendert
- Karten- und Modusauswahl funktionieren
- Suche akzeptiert mehrere Zeichen ohne Fokusverlust
- Zonenkarte enthält 17 echte Buttons
- Zone öffnet die korrekte Liste zugeordneter Schritte
- Ein Zonenschritt öffnet exakt diesen Schritt im Fokusmodus
- Schritt abhaken, Undo und erneutes Öffnen funktionieren
- Notiz wird gespeichert
- lokale Migration verschachtelter V2-Daten funktioniert
- Service-Worker-Dateiliste stimmt mit den Dateien überein

## Nach dem GitHub-Commit kurz manuell prüfen

1. Karte öffnen und `Outer Ward`, `War Room` und `Sanctum` antippen.
2. In einem Bereich einen Schritt öffnen.
3. Im Fokusmodus abhaken und Undo testen.
4. Suche mit mindestens fünf Buchstaben testen.
5. Safari neu laden und prüfen, ob der Fortschritt bleibt.
