# Kowakujō – Squad Guide V3

## Diese Dateien ersetzen

Alle Dateien aus diesem Ordner gehören in das Stammverzeichnis des GitHub-Repositories `xraphyx/zombies`.
Vorhandene Dateien mit gleichem Namen ersetzen und anschließend **Commit changes** drücken.

Die GitHub-Pages-Adresse bleibt:

`https://xraphyx.github.io/zombies/`

## Wichtig nach dem Commit

Die neue Version verwendet einen neuen Service-Worker-Cache und Versionsparameter. Öffne die Seite nach dem Deployment einmal neu.
Falls weiterhin eine alte Version erscheint:

1. App → **Mehr**
2. **Neue App-Version laden**
3. Seite erneut öffnen

## Wichtigste Korrekturen

- Die alte Karte verwendete versehentlich HTML-Namespace-Elemente für `svg`, `g`, `rect` und `text`.
- Die neue Karte verwendet ausschließlich echte HTML-Buttons mit großen Touch-Flächen und funktioniert daher zuverlässig in iPhone-Safari.
- Die Kartenanordnung wurde logisch umgedreht: Outer Ward unten, inneres Sanctum oben.
- Jede Zone zeigt offene Schritte und öffnet exakt den ausgewählten Schritt im Fokusmodus.
- Zusätzlich gibt es unter der Karte eine vollständige klickbare Zonenliste als Touch- und Accessibility-Fallback.
- Der alte generische Pfad-Setter zerlegte Schrittschlüssel wie `paps.wards` fälschlich in verschachtelte Objekte. Fortschritt, Notizen und Favoriten werden nun korrekt gespeichert.
- Bereits falsch verschachtelte lokale Daten werden beim Start automatisch migriert.
- Die Suche behält beim Tippen Fokus und Cursorposition.
- Details, Notizfelder, Favoriten, Undo und Fokusnavigation wurden korrigiert.
- „Wieder öffnen“ springt nicht mehr fälschlich zum nächsten Schritt.
- Run-Ziele, „Jetzt sinnvoll“ und Boss-Checkliste sind jetzt tatsächlich implementiert.
- Service Worker nutzt für Seitenaufrufe Network-first und verhindert deutlich besser veraltete Builds.

## Optionaler Squad-Sync

Die App funktioniert ohne Backend vollständig lokal.
Für Raumcodes in `config.js` eintragen:

```js
window.KOWA_CONFIG = {
  supabaseUrl: "DEINE_URL",
  supabaseAnonKey: "DEIN_PUBLISHABLE_ODER_ANON_KEY"
};
```

Es ist keine Datenbanktabelle nötig; verwendet werden Supabase Realtime Broadcast und Presence.

## Quest-Inhalte bearbeiten

- `guide-data.js`: Schritte, Zonen, Kartenpositionen, Run-Ziele und Boss-Checkliste
- `app.js`: Interaktionslogik
- `styles.css`: Darstellung
