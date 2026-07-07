// quiz.js – reine Logik (kein DOM): Runde zusammenstellen, Generatoren einmischen, prüfen.
import { GEN_BY_TOPIC, CATEGORIES } from "./config.js";
import { GENERATORS } from "./generators.js";
import { loadQuestionsForTopics, loadCategory } from "./loader.js";
import { questionId, getWeights } from "./storage.js";

export function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function norm(s) {
  return String(s).trim().toLowerCase().replace(/\s+/g, "");
}

// internes, einheitliches Frageformat. id nur für statische Fragen (stabil für Bookmarks/Gewichte).
function normalizeQ(x, isGenerated = false) {
  return {
    topic: x.t, text: x.q, type: x.type,
    options: x.o, correct: x.c, explain: x.e,
    accept: x.a, hint: x.h, placeholder: x.p,
    generated: isGenerated,
    id: isGenerated ? null : questionId(x.q)
  };
}

// Entfernt Dubletten (gleicher Fragetext) innerhalb einer Runde – Sicherheitsnetz.
function dedupe(pool) {
  const seen = new Set();
  return pool.filter(q => {
    const k = norm(q.text);
    if (seen.has(k)) return false;
    seen.add(k); return true;
  });
}

// Gewichtetes Ziehen ohne Zurücklegen (Karteikarten-Prinzip): schwere Fragen kommen eher dran.
// Efraimidis-Spirakis: Schlüssel = random^(1/gewicht), größter Schlüssel zuerst.
function weightedOrder(pool) {
  const w = getWeights();
  return pool
    .map(q => ({ q, k: Math.pow(Math.random(), 1 / (q.id && w[q.id] ? w[q.id] : 1)) }))
    .sort((a, b) => b.k - a.k)
    .map(x => x.q);
}

// Baut eine Quizrunde: lädt statische Fragen (lazy) + mischt generierte Aufgaben dazu.
// opts: { genCount, limit, useWeights }
export async function buildRound(selectedTopics, opts = {}) {
  const { genCount = 0, limit = 0, useWeights = false } = opts;

  const staticRaw = await loadQuestionsForTopics(selectedTopics);
  let pool = staticRaw.map(q => normalizeQ(q, false));

  const genTopics = selectedTopics.filter(t => GEN_BY_TOPIC[t]);
  if (genCount > 0 && genTopics.length > 0) {
    for (let i = 0; i < genCount; i++) {
      const t = genTopics[i % genTopics.length];
      const gens = GEN_BY_TOPIC[t];
      const gName = gens[Math.floor(Math.random() * gens.length)];
      pool.push(normalizeQ(GENERATORS[gName](), true));
    }
  }

  pool = dedupe(pool);
  pool = useWeights ? weightedOrder(pool) : shuffle(pool);
  if (limit > 0 && pool.length > limit) pool = pool.slice(0, limit);
  return pool;
}

// Wiederholungsrunde aus bereits normalisierten Fragen (z.B. die falsch beantworteten).
export function buildRepeat(questions) {
  return shuffle(dedupe(questions.slice()));
}

// Runde nur aus markierten (gemerkten) Fragen – lädt alle Kategorien und filtert nach IDs.
export async function buildBookmarkRound(bookmarkIds) {
  const want = new Set(bookmarkIds);
  const cats = await Promise.all(Object.keys(CATEGORIES).map(loadCategory));
  const pool = cats.flat()
    .map(q => normalizeQ(q, false))
    .filter(q => want.has(q.id));
  return shuffle(pool);
}

// Prüft eine Eingabe-Antwort
export function checkInput(question, value) {
  return question.accept.some(x => norm(x) === norm(value));
}
