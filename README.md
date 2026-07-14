# Kowakujō – GitHub Pages App

## Veröffentlichen

1. Alle Dateien aus diesem Ordner in das Stammverzeichnis deines GitHub-Repositories hochladen.
2. Bei GitHub Free muss das Repository öffentlich sein.
3. Repository → **Settings** → **Pages**.
4. Unter **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main**
   - Folder: **/(root)**
5. **Save**.

Die Adresse lautet anschließend normalerweise:

`https://DEIN-BENUTZERNAME.github.io/REPOSITORY-NAME/`

## Version 2 – zusätzlich

- Run-Zielauswahl: Casual, Wunderwaffe, Easter Egg oder 100 %
- Dynamische Liste „Jetzt sinnvoll“
- Allgemeine Boss-Vorbereitungscheckliste
- Zielabhängiges Ausblenden unnötiger Abschnitte
- Erweiterter Export/Import inklusive Ziel und Bossstatus

## Enthalten

- Mobile Checkliste mit lokaler Speicherung
- Fokusmodus mit vorherigem/nächstem Schritt und Abschlussansicht
- Schematische, anklickbare Karte
- Suche, Favoriten und funktionierendes Undo
- Vollständiger Export/Import
- Offline-App-Shell, Manifest und iPhone-Icons
- Optionaler Online-Squad-Sync per Supabase Realtime

## Quest-Inhalte ändern

Alle Questtexte und Zonen stehen in `guide-data.js`. Änderungen an dieser Datei benötigen keine Anpassung der App-Logik.

## Optionaler Online-Squad-Sync

Die App funktioniert ohne Backend vollständig lokal.

Für gemeinsame Raumcodes:

1. Ein Supabase-Projekt erstellen.
2. Project URL und Publishable/Anon Key kopieren.
3. Beide Werte in `config.js` eintragen.

Es ist keine Datenbanktabelle erforderlich. Der Sync verwendet Realtime Broadcast und Presence. Später beitretende Geräte fordern automatisch einen aktuellen Snapshot von bereits verbundenen Squad-Mitgliedern an. Wenn kein Squad-Mitglied verbunden ist, wird der Raumzustand nicht dauerhaft auf dem Server gespeichert.

## Inhaltlicher Hinweis

Der Anwendungscode wurde auf die gefundenen Fehler hin korrigiert. Die Questtexte sind bewusst als Community-Checkliste formuliert. Spielinhalte und mögliche Bereiche sollten nach Updates gegen verlässliche Quellen geprüft werden.
