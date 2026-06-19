// loader.js – lädt Fragendaten erst bei Bedarf (dynamisches import()) und cached sie.
import { CATEGORIES, TOPIC_TO_CAT } from "./config.js";

const cache = new Map(); // catKey -> Array<Frage>

// Lädt eine Kategorie (einmalig) und gibt ihre Fragen zurück.
async function loadCategory(catKey) {
  if (cache.has(catKey)) return cache.get(catKey);
  const mod = await CATEGORIES[catKey].load(); // dynamischer import → eigener Netzwerk-Request, nur bei Bedarf
  const data = mod.default;
  cache.set(catKey, data);
  return data;
}

// Lädt alle Fragen zu einer Menge ausgewählter THEMEN.
// Es werden nur die Kategorien geladen, in denen die gewählten Themen liegen.
export async function loadQuestionsForTopics(selectedTopics) {
  const neededCats = new Set();
  selectedTopics.forEach(t => {
    const c = TOPIC_TO_CAT[t];
    if (c) neededCats.add(c);
  });

  const chunks = await Promise.all([...neededCats].map(loadCategory));
  const merged = chunks.flat();

  // nur Fragen der wirklich gewählten Themen behalten
  const sel = new Set(selectedTopics);
  return merged.filter(q => sel.has(q.t));
}

// Optional: alles vorladen (z. B. für „alle Themen")
export async function preloadAll() {
  await Promise.all(Object.keys(CATEGORIES).map(loadCategory));
}
