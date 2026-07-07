// storage.js – persistiert Einstellungen & Lernstand in localStorage.
// Alles unter einem Namespace; bei fehlendem/kaputtem Speicher wird ein leerer Default genutzt,
// damit das Quiz auch im privaten Modus oder ohne Speicher läuft.

const KEY = "fisiquiz.v2";

const DEFAULTS = {
  theme: "light",         // "dark" | "light"
  progress: {},           // thema -> { ok, total }
  bookmarks: {},           // frageId -> true
  weights: {},             // frageId -> Gewicht (>1 = öfter dran, Karteikarten-Prinzip)
  session: null            // gespeicherte, unterbrochene Übungsrunde (zum späteren Fortfahren)
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    return Object.assign(structuredClone(DEFAULTS), JSON.parse(raw));
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function write(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Speicher nicht verfügbar – ignorieren */ }
}

// Stabile ID einer (statischen) Frage aus ihrem Text.
export function questionId(text) {
  return String(text).trim().toLowerCase().replace(/\s+/g, " ");
}

// ---- Theme ----
export function getTheme() { return read().theme; }
export function setTheme(theme) { const d = read(); d.theme = theme; write(d); }

// ---- Lernfortschritt pro Thema ----
export function recordResult(topic, correct) {
  const d = read();
  const p = d.progress[topic] || { ok: 0, total: 0 };
  p.total++; if (correct) p.ok++;
  d.progress[topic] = p;
  write(d);
}
export function getProgress() { return read().progress; }
export function resetProgress() { const d = read(); d.progress = {}; d.weights = {}; write(d); }

// ---- Karteikarten-Gewichte (leichtes Spaced-Repetition) ----
// Falsch beantwortet -> Gewicht hoch (kommt öfter), richtig -> Gewicht runter (Minimum 1).
export function recordWeight(id, correct) {
  const d = read();
  const cur = d.weights[id] || 1;
  d.weights[id] = correct ? Math.max(1, cur - 1) : Math.min(8, cur + 2);
  write(d);
}
export function getWeights() { return read().weights; }

// ---- Unterbrochene Übungsrunde (später fortfahren) ----
export function saveSession(session) { const d = read(); d.session = session; write(d); }
export function getSession() { return read().session || null; }
export function clearSession() { const d = read(); d.session = null; write(d); }

// ---- Lesezeichen ----
export function isBookmarked(id) { return !!read().bookmarks[id]; }
export function toggleBookmark(id) {
  const d = read();
  if (d.bookmarks[id]) delete d.bookmarks[id]; else d.bookmarks[id] = true;
  write(d);
  return !!d.bookmarks[id];
}
export function getBookmarks() { return Object.keys(read().bookmarks); }
