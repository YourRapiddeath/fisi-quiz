// ui.js – alles rund ums DOM. Nutzt config + quiz-Logik.
import { CATEGORIES, GEN_BY_TOPIC, STATIC_COUNTS } from "./config.js";
import { buildRound, checkInput } from "./quiz.js";

const screen = () => document.getElementById("screen");
const subEl = () => document.getElementById("sub");

// ---- State ----
const state = {
  selected: new Set(),
  collapsed: new Set(),
  genCount: 200,
  limitCount: 0,
  active: [],
  cur: 0,
  ans: []
};

const hasGen = t => !!GEN_BY_TOPIC[t];
const esc = s => String(s).replace(/'/g, "\\'");

// ================= FILTER =================
export function renderFilter() {
  subEl().textContent = "Themen wählen · AP1 + AP2";
  const totalStatic = Object.values(STATIC_COUNTS).reduce((a, b) => a + b, 0);
  const allTopicsCount = Object.values(CATEGORIES).reduce((a, c) => a + c.topics.length, 0);
  const selStatic = [...state.selected].reduce((a, t) => a + (STATIC_COUNTS[t] || 0), 0);

  let cats = "";
  for (const [key, def] of Object.entries(CATEGORIES)) {
    const isCol = state.collapsed.has(key);
    let chips = "";
    if (!isCol) {
      def.topics.forEach(t => {
        const on = state.selected.has(t);
        const sc = STATIC_COUNTS[t] || 0;
        const gb = hasGen(t) ? `<span class="gen-badge">+gen</span>` : "";
        chips += `<div class="chk ${on ? "on" : ""}" data-topic="${t}">
          <div class="box">${on ? "✓" : ""}</div>
          <span class="nm">${t}${gb}</span>
          <span class="cnt">${sc}</span>
        </div>`;
      });
    }
    const selInCat = def.topics.filter(t => state.selected.has(t)).length;
    cats += `<div class="cat-block">
      <div class="cat-head" data-cat="${key}">
        <span>${def.label}</span>
        <span class="toggle">${selInCat}/${def.topics.length} · ${isCol ? "▼ zeigen" : "▲ ein/aus"}</span>
      </div>
      ${isCol ? "" : `<div class="grid">${chips}</div>`}
    </div>`;
  }

  screen().innerHTML = `
    <div class="qc">
      <p class="stat-line"><b>${totalStatic}</b> feste Fragen · <b>500.000+</b> generierbare Rechenaufgaben · <b>${allTopicsCount}</b> Themen</p>
      <p class="filter-intro">Wähle Themen aus. <span class="gen-badge">+gen</span> = dazu lassen sich beliebig viele frische Rechenaufgaben erzeugen. Daten werden erst geladen, wenn du startest – das hält die Seite schnell.</p>
      <div class="ctrl">
        <button class="mini" data-act="all">Alles auswählen</button>
        <button class="mini" data-act="none">Alles abwählen</button>
        <button class="mini" data-act="collapse">Kategorien einklappen</button>
      </div>
      ${cats}
      <div class="opt-config">
        <div class="row2">
          <div>
            <label>Generierte Zusatzaufgaben</label>
            <select id="genSel">
              <option value="0">keine</option>
              <option value="100">+100</option>
              <option value="200" selected>+200</option>
              <option value="500">+500</option>
              <option value="800">+800</option>
              <option value="1000">+1000</option>
            </select>
          </div>
          <div>
            <label>Fragen-Limit pro Runde</label>
            <select id="limSel">
              <option value="0" selected>alle</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
      </div>
      <button class="start" id="startBtn" ${selStatic === 0 ? "disabled" : ""}>
        ${selStatic === 0 ? "Mindestens 1 Thema wählen" : "Quiz starten"}
      </button>
    </div>`;

  // ---- Events (Event-Delegation statt inline-onclick) ----
  screen().querySelectorAll(".chk").forEach(el =>
    el.addEventListener("click", () => toggleTopic(el.dataset.topic)));
  screen().querySelectorAll(".cat-head").forEach(el =>
    el.addEventListener("click", () => toggleCat(el.dataset.cat)));
  screen().querySelectorAll(".mini").forEach(el =>
    el.addEventListener("click", () => {
      const a = el.dataset.act;
      if (a === "all") Object.values(CATEGORIES).forEach(c => c.topics.forEach(t => state.selected.add(t)));
      if (a === "none") state.selected.clear();
      if (a === "collapse") Object.keys(CATEGORIES).forEach(k => state.collapsed.add(k));
      renderFilter();
    }));
  const gs = document.getElementById("genSel");
  const ls = document.getElementById("limSel");
  gs.value = state.genCount; ls.value = state.limitCount;
  gs.addEventListener("change", e => state.genCount = parseInt(e.target.value));
  ls.addEventListener("change", e => state.limitCount = parseInt(e.target.value));
  const sb = document.getElementById("startBtn");
  if (selStatic > 0) sb.addEventListener("click", start);
}

function toggleTopic(t) { state.selected.has(t) ? state.selected.delete(t) : state.selected.add(t); renderFilter(); }
function toggleCat(c) { state.collapsed.has(c) ? state.collapsed.delete(c) : state.collapsed.add(c); renderFilter(); }

// ================= START =================
async function start() {
  subEl().textContent = "Lädt …";
  screen().innerHTML = `<div class="qc" style="text-align:center;padding:40px 0;">
    <div class="rs" style="font-size:28px;">⏳</div>
    <p class="rl">Fragen werden geladen …</p></div>`;
  try {
    state.active = await buildRound([...state.selected], state.genCount, state.limitCount);
    state.ans = new Array(state.active.length).fill(null);
    state.cur = 0;
    renderQ();
  } catch (e) {
    screen().innerHTML = `<div class="qc"><p class="filter-intro">Fehler beim Laden: ${e.message}<br><br>
      Hinweis: ES-Module brauchen einen Webserver. Auf GitHub Pages läuft es; lokal per Doppelklick (file://) nicht.</p>
      <button class="start" id="back">Zurück</button></div>`;
    document.getElementById("back").addEventListener("click", renderFilter);
  }
}

// ================= FRAGE =================
function renderQ() {
  if (state.cur >= state.active.length) return renderRes();
  const q = state.active[state.cur];
  const a = state.ans[state.cur];
  const answered = a !== null;
  subEl().textContent = `Frage ${state.cur + 1} von ${state.active.length}`;

  let h = `<div class="pbar"><div class="pfill" style="width:${(state.cur / state.active.length) * 100}%"></div></div>
    <div class="qc"><span class="tag">${q.topic}</span>
    <div class="qnum">Frage ${state.cur + 1} / ${state.active.length}</div>
    <div class="qt">${q.text}</div>`;

  if (q.type === "tf") {
    ["Wahr", "Falsch"].forEach((lab, idx) => {
      const bv = idx === 0; let c = "opt";
      if (answered) { c += " dis"; if (bv === a.choice) c += " sel"; if (bv === q.correct) c += " cor"; else if (bv === a.choice && bv !== q.correct) c += " wr"; }
      const m = answered && bv === q.correct ? "✓" : (answered && bv === a.choice && bv !== q.correct ? "✗" : "");
      h += `<div class="${c}" data-tf="${bv}"><div class="ob">${m}</div><div class="ot">${lab}</div></div>`;
    });
  } else if (q.type === "mc") {
    q.options.forEach((o, idx) => {
      let c = "opt";
      if (answered) { c += " dis"; if (idx === a.choice) c += " sel"; if (idx === q.correct) c += " cor"; else if (idx === a.choice && idx !== q.correct) c += " wr"; }
      const L = String.fromCharCode(65 + idx);
      const m = answered && idx === q.correct ? "✓" : (answered && idx === a.choice && idx !== q.correct ? "✗" : "");
      h += `<div class="${c}" data-mc="${idx}"><div class="ob">${m}</div><div class="ot"><span class="ol">${L})</span>${o}</div></div>`;
    });
  } else {
    const ic = answered ? (a.correct ? "cor" : "wr") : "";
    const iv = answered ? a.value : "";
    h += `<div class="ia"><input id="ta" class="${ic}" placeholder="${q.placeholder || "Antwort"}" value="${iv}" ${answered ? "disabled" : ""} autocomplete="off" autocapitalize="off" spellcheck="false"><div class="hint">💡 ${q.hint || ""}</div></div>`;
  }

  if (answered) {
    let pre = "";
    if (q.type === "in") pre = a.correct ? "<b>✓ Richtig!</b> " : "<b>✗ Nicht ganz.</b> ";
    h += `<div class="exp show">${pre}${q.explain}</div>`;
  }

  h += `<div class="brow">`;
  if (q.type === "in" && !answered) h += `<button class="btn btn-p" id="checkBtn">Prüfen</button>`;
  else if (answered) h += `<button class="btn btn-p" id="nextBtn">${state.cur === state.active.length - 1 ? "Ergebnis" : "Weiter →"}</button>`;
  h += `<button class="btn btn-g" id="toFilter">Themen</button></div></div>`;

  screen().innerHTML = h;

  screen().querySelectorAll("[data-tf]").forEach(el =>
    el.addEventListener("click", () => { if (!answered) answer(el.dataset.tf === "true"); }));
  screen().querySelectorAll("[data-mc]").forEach(el =>
    el.addEventListener("click", () => { if (!answered) answer(parseInt(el.dataset.mc)); }));
  const cb = document.getElementById("checkBtn");
  if (cb) cb.addEventListener("click", submitInput);
  const nb = document.getElementById("nextBtn");
  if (nb) nb.addEventListener("click", () => { state.cur++; renderQ(); });
  document.getElementById("toFilter").addEventListener("click", renderFilter);

  if (q.type === "in" && !answered) {
    const inp = document.getElementById("ta");
    if (inp) {
      inp.addEventListener("keydown", e => { if (e.key === "Enter") submitInput(); });
      setTimeout(() => inp.focus(), 40);
    }
  }
}

function answer(choice) {
  const q = state.active[state.cur];
  state.ans[state.cur] = { choice, correct: choice === q.correct };
  renderQ();
}

function submitInput() {
  const el = document.getElementById("ta");
  if (!el) return;
  const q = state.active[state.cur];
  const ok = checkInput(q, el.value);
  state.ans[state.cur] = { value: el.value.replace(/"/g, "&quot;"), correct: ok };
  renderQ();
}

// ================= ERGEBNIS =================
function renderRes() {
  const tot = state.active.length;
  const sc = state.ans.filter(a => a && a.correct).length;
  const pct = Math.round(sc / tot * 100);
  subEl().textContent = "Abgeschlossen";
  let msg;
  if (pct === 100) msg = "🏆 Perfekt!";
  else if (pct >= 85) msg = "💪 Stark – fast prüfungsreif!";
  else if (pct >= 70) msg = "👍 Gute Basis.";
  else if (pct >= 50) msg = "📚 Solider Anfang.";
  else msg = "🔁 Dranbleiben!";

  const bt = {};
  state.active.forEach((q, i) => {
    if (!bt[q.topic]) bt[q.topic] = { ok: 0, t: 0 };
    bt[q.topic].t++;
    if (state.ans[i] && state.ans[i].correct) bt[q.topic].ok++;
  });
  let st = "";
  Object.keys(bt).sort().forEach(t => {
    const b = bt[t]; const p = Math.round(b.ok / b.t * 100);
    st += `<div class="tsr"><span style="min-width:120px">${t}</span><div class="bbg"><div class="bf" style="width:${p}%"></div></div><b>${b.ok}/${b.t}</b></div>`;
  });

  screen().innerHTML = `<div class="res">
    <div class="rs">${sc}/${tot}</div><div class="rl">${pct}% richtig</div><div class="rm">${msg}</div>
    <div class="brow" style="max-width:440px;margin:0 auto;">
      <button class="btn btn-p" id="again">Neue Runde (gleiche Themen)</button>
      <button class="btn btn-g" id="change">Themen ändern</button>
    </div>
    <div class="tstats">${st}</div>
  </div>`;
  document.getElementById("again").addEventListener("click", start);
  document.getElementById("change").addEventListener("click", renderFilter);
}
