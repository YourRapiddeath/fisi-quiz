// quiz.js – reine Logik (kein DOM): Runde zusammenstellen, Generatoren einmischen, prüfen.
import { GEN_BY_TOPIC } from "./config.js";
import { GENERATORS } from "./generators.js";
import { loadQuestionsForTopics } from "./loader.js";

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

// internes, einheitliches Frageformat
function normalizeQ(x) {
  return {
    topic: x.t, text: x.q, type: x.type,
    options: x.o, correct: x.c, explain: x.e,
    accept: x.a, hint: x.h, placeholder: x.p
  };
}

// Baut eine Quizrunde: lädt statische Fragen (lazy) + mischt generierte Aufgaben dazu.
export async function buildRound(selectedTopics, genCount, limitCount) {
  const staticRaw = await loadQuestionsForTopics(selectedTopics);
  let pool = staticRaw.map(normalizeQ);

  const genTopics = selectedTopics.filter(t => GEN_BY_TOPIC[t]);
  if (genCount > 0 && genTopics.length > 0) {
    for (let i = 0; i < genCount; i++) {
      const t = genTopics[i % genTopics.length];
      const gens = GEN_BY_TOPIC[t];
      const gName = gens[Math.floor(Math.random() * gens.length)];
      pool.push(normalizeQ(GENERATORS[gName]()));
    }
  }

  shuffle(pool);
  if (limitCount > 0 && pool.length > limitCount) pool = pool.slice(0, limitCount);
  return pool;
}

// Prüft eine Eingabe-Antwort
export function checkInput(question, value) {
  return question.accept.some(x => norm(x) === norm(value));
}
