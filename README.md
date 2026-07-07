# FiSi-Quiz · AP1 + AP2 Prüfungstrainer

Ein leichtgewichtiger, werbefreier Prüfungstrainer für die Abschlussprüfung **Fachinformatiker (FiSi)** – Teil 1 und Teil 2. Reines HTML/CSS/JavaScript, **keine Frameworks, keine Build-Tools, kein Backend**. Läuft direkt auf GitHub Pages.

## Funktionen

- **423 feste Fragen** über 58 Themen (Multiple-Choice, Wahr/Falsch, Eingabe) – ohne Dubletten.
- **500.000+ generierbare Rechenaufgaben** (Subnetting, Zahlensysteme, Energiekosten, RAID, Kalkulation …) – bei jedem Start frisch erzeugt.
- **Prüfungsmodus** mit Countdown-Timer (1 Min./Frage) und Auflösung erst am Ende.
- **Karteikarten-Modus** – zuvor falsch beantwortete Fragen kommen häufiger dran.
- **Falsche Fragen wiederholen** direkt nach jeder Runde.
- **Lernfortschritt** wird lokal gespeichert und pro Thema als Balken angezeigt.
- **Fragen markieren** (Lesezeichen) und gezielt nur markierte Fragen üben.
- **Dark-/Light-Mode** mit gespeicherter Auswahl.
- **Tastatursteuerung**: `1`–`4` Antworten · `W`/`F` für Wahr/Falsch · `Enter` Weiter · `B` merken.

## Themengebiete

Netzwerktechnik · Hardware & Systeme · IT-Sicherheit & Recht · Datenbanken & Programmierung · Wirtschaft & Projekt.

## Projektstruktur

```
.
├── index.html          # Einstiegsseite
├── styles.css          # Theme-System (Dark/Light) + Komponenten
├── main.js             # Einstiegspunkt (setzt Theme, rendert Auswahl)
├── core/
│   ├── config.js       # Themen-Metadaten, Generator-Zuordnung, Fragenzahlen
│   ├── loader.js       # lädt Fragendaten lazy per dynamischem import()
│   ├── generators.js   # prozedurale Rechenaufgaben-Generatoren
│   ├── quiz.js          # Logik: Runde bauen, mischen, prüfen (kein DOM)
│   ├── storage.js      # localStorage: Theme, Lernstand, Lesezeichen
│   └── ui.js           # gesamtes DOM-Rendering & Interaktion
└── data/
    ├── net.js  sys.js  sec.js  dev.js  biz.js   # Fragendaten je Kategorie
```

## Lokal starten

ES-Module benötigen einen Webserver – ein Doppelklick auf `index.html` (`file://`) funktioniert **nicht**. Stattdessen z. B.:

```bash
# Python 3
python3 -m http.server 8000
# danach im Browser öffnen:
# http://localhost:8000
```

oder mit Node:

```bash
npx serve .
```

## Auf GitHub Pages veröffentlichen

1. Neues Repository auf GitHub anlegen (z. B. `fisi-quiz`).
2. Diese Dateien in das Repo hochladen (per Web-Upload oder Git):

   ```bash
   git init
   git add .
   git commit -m "Initial commit: FiSi-Quiz"
   git branch -M main
   git remote add origin https://github.com/DEIN-NAME/fisi-quiz.git
   git push -u origin main
   ```

3. Im Repo: **Settings → Pages → Build and deployment → Source: „Deploy from a branch"**, Branch `main`, Ordner `/ (root)`, speichern.
4. Nach kurzer Zeit ist das Quiz unter `https://DEIN-NAME.github.io/fisi-quiz/` erreichbar.

## Eigene Fragen ergänzen

Fragen liegen in `data/<kategorie>.js` als JSON-Objekte. Felder:

| Feld | Bedeutung |
|------|-----------|
| `t` | Thema (muss in `core/config.js` existieren) |
| `type` | `"mc"` (Multiple-Choice), `"tf"` (Wahr/Falsch) oder `"in"` (Eingabe) |
| `q` | Fragetext |
| `o` | Antwortoptionen (nur `mc`) |
| `c` | Index der richtigen Option (`mc`) bzw. `true`/`false` (`tf`) |
| `a` | Liste akzeptierter Antworten (nur `in`) |
| `p` | Platzhalter im Eingabefeld (`in`) |
| `h` | Hinweis (`in`) |
| `e` | Erklärung (wird nach dem Antworten angezeigt) |

Nach dem Hinzufügen die Fragenzahl im Objekt `STATIC_COUNTS` in `core/config.js` anpassen (oder einfach gleich lassen – sie dient nur den Anzeige-Badges).

## Lizenz

MIT – siehe [LICENSE](LICENSE).
