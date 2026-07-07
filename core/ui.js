// ui.js – alles rund ums DOM. Nutzt config, quiz-Logik und storage.
import { CATEGORIES, GEN_BY_TOPIC, STATIC_COUNTS } from "./config.js";
import { buildRound, buildRepeat, buildBookmarkRound, checkInput } from "./quiz.js";
import * as store from "./storage.js";

const screen = () => document.getElementById("screen");
const subEl = () => document.getElementById("sub");
const byId = id => document.getElementById(id);

// ---- State ----
const state = {
  selected: new Set(),
  collapsed: new Set(),
  genCount: 200,
  limitCount: 0,
  examMode: false,
  useWeights: false,
  view: "filter",        // filter | question | result
  roundMode: "topics",   // topics | bookmarks | repeat
  active: [],
  cur: 0,
  ans: [],
  wrong: [],
  timer: null            // { remaining, id }
};

const hasGen = t => !!GEN_BY_TOPIC[t];

// ================= THEME =================
export function applyTheme() {
  document.documentElement.setAttribute("data-theme", store.getTheme());
}
function toggleTheme() {
  store.setTheme(store.getTheme() === "dark" ? "light" : "dark");
  applyTheme();
  if (state.view === "filter") renderFilter();
}
function themeBtnHtml() {
  const dark = store.getTheme() === "dark";
  return `<button class="icon-btn" id="themeBtn">${dark ? "☀️ Hell" : "🌙 Dunkel"}</button>`;
}

// ================= TIMER (Prüfungsmodus) =================
function startTimer(totalSeconds, onEnd) {
  stopTimer();
  state.timer = { remaining: totalSeconds, id: null };
  state.timer.id = setInterval(() => {
    state.timer.remaining--;
    renderTimer();
    if (state.timer.remaining <= 0) { stopTimer(); onEnd(); }
  }, 1000);
}
function stopTimer() {
  if (state.timer && state.timer.id) clearInterval(state.timer.id);
  state.timer = null;
}
function renderTimer() {
  const el = byId("timer");
  if (!el || !state.timer) return;
  const r = Math.max(0, state.timer.remaining);
  const m = String(Math.floor(r / 60)).padStart(2, "0");
  const s = String(r % 60).padStart(2, "0");
  el.textContent = `⏱ ${m}:${s}`;
  el.classList.toggle("low", r <= 30);
}

// ================= FILTER =================
export function renderFilter() {
  state.view = "filter";
  stopTimer();
  subEl().textContent = "Themen wählen · AP1 + AP2";

  const totalStatic = Object.values(STATIC_COUNTS).reduce((a, b) => a + b, 0);
  const allTopicsCount = Object.values(CATEGORIES).reduce((a, c) => a + c.topics.length, 0);
  const selStatic = [...state.selected].reduce((a, t) => a + (STATIC_COUNTS[t] || 0), 0);
  const progress = store.getProgress();
  const bookmarks = store.getBookmarks();
  const session = store.getSession();

  let cats = "";
  for (const [key, def] of Object.entries(CATEGORIES)) {
    const isCol = state.collapsed.has(key);
    let chips = "";
    if (!isCol) {
      def.topics.forEach(t => {
        const on = state.selected.has(t);
        const sc = STATIC_COUNTS[t] || 0;
        const gb = hasGen(t) ? `<span class="gen-badge">+gen</span>` : "";
        const pr = progress[t];
        const pct = pr && pr.total ? Math.round(pr.ok / pr.total * 100) : 0;
        const badge = pr && pr.total
          ? `<span class="pbadge" title="${pr.ok}/${pr.total} richtig"><i style="width:${pct}%"></i></span>`
          : "";
        chips += `<div class="chk ${on ? "on" : ""}" data-topic="${t}">
          <div class="box">${on ? "✓" : ""}</div>
          <span class="nm">${t}${gb}</span>
          ${badge}
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
      <div class="topbar">
        <span class="stat-line"><b>${totalStatic}</b> feste Fragen · <b>500.000+</b> generierbare Aufgaben · <b>${allTopicsCount}</b> Themen</span>
        ${themeBtnHtml()}
      </div>
      <p class="filter-intro">Wähle Themen aus. <span class="gen-badge">+gen</span> = beliebig viele frische Rechenaufgaben. Der farbige Balken zeigt deinen gespeicherten Lernstand.</p>
      <div class="ctrl">
        <button class="mini" data-act="all">Alles auswählen</button>
        <button class="mini" data-act="none">Alles abwählen</button>
        <button class="mini" data-act="collapse">Kategorien einklappen</button>
        <button class="mini danger" data-act="reset">Lernstand zurücksetzen</button>
      </div>
      ${cats}
      <div class="opt-config">
        <div class="row2">
          <div>
            <label>Generierte Zusatzaufgaben</label>
            <select id="genSel">
              <option value="0">keine</option>
              <option value="100">+100</option>
              <option value="200">+200</option>
              <option value="500">+500</option>
              <option value="800">+800</option>
              <option value="1000">+1000</option>
            </select>
          </div>
          <div>
            <label>Fragen-Limit pro Runde</label>
            <select id="limSel">
              <option value="0">alle</option>
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </select>
          </div>
        </div>
        <div class="switch-row">
          <div><div class="lbl">Prüfungsmodus</div><div class="desc">Timer läuft, Auflösung erst am Ende.</div></div>
          <div class="switch ${state.examMode ? "on" : ""}" id="examSw"></div>
        </div>
        <div class="switch-row">
          <div><div class="lbl">Karteikarten-Modus</div><div class="desc">Zuvor falsch beantwortete Fragen kommen häufiger dran.</div></div>
          <div class="switch ${state.useWeights ? "on" : ""}" id="wSw"></div>
        </div>
      </div>
      ${session ? `<button class="start resume" id="resumeBtn">
        ▶ Übung fortsetzen (Frage ${(session.cur || 0) + 1}/${session.active.length})
      </button>` : ""}
      <button class="start" id="startBtn" ${selStatic === 0 ? "disabled" : ""}>
        ${selStatic === 0 ? "Mindestens 1 Thema wählen" : "Quiz starten"}
      </button>
      <button class="start secondary" id="bmBtn" ${bookmarks.length === 0 ? "disabled" : ""}>
        ⭐ Markierte Fragen üben (${bookmarks.length})
      </button>
    </div>`;

  // Werte der Selects setzen
  byId("genSel").value = state.genCount;
  byId("limSel").value = state.limitCount;

  // Events
  screen().querySelectorAll(".chk").forEach(el =>
    el.addEventListener("click", () => toggleTopic(el.dataset.topic)));
  screen().querySelectorAll(".cat-head").forEach(el =>
    el.addEventListener("click", () => toggleCat(el.dataset.cat)));
  screen().querySelectorAll(".mini").forEach(el =>
    el.addEventListener("click", () => doControl(el.dataset.act)));
  byId("genSel").addEventListener("change", e => state.genCount = parseInt(e.target.value));
  byId("limSel").addEventListener("change", e => state.limitCount = parseInt(e.target.value));
  byId("examSw").addEventListener("click", () => { state.examMode = !state.examMode; renderFilter(); });
  byId("wSw").addEventListener("click", () => { state.useWeights = !state.useWeights; renderFilter(); });
  byId("themeBtn").addEventListener("click", toggleTheme);
  const sb = byId("startBtn");
  if (selStatic > 0) sb.addEventListener("click", () => start("topics"));
  const bm = byId("bmBtn");
  if (bookmarks.length > 0) bm.addEventListener("click", () => start("bookmarks"));
  const rb = byId("resumeBtn");
  if (rb) rb.addEventListener("click", resumeSession);
}

function doControl(a) {
  if (a === "all") Object.values(CATEGORIES).forEach(c => c.topics.forEach(t => state.selected.add(t)));
  if (a === "none") state.selected.clear();
  if (a === "collapse") Object.keys(CATEGORIES).forEach(k => state.collapsed.add(k));
  if (a === "reset") {
    if (confirm("Gespeicherten Lernstand, Markierungen und unterbrochene Übung wirklich löschen?")) {
      store.getBookmarks().forEach(id => store.toggleBookmark(id));
      store.resetProgress();
      store.clearSession();
    }
  }
  renderFilter();
}

function toggleTopic(t) { state.selected.has(t) ? state.selected.delete(t) : state.selected.add(t); renderFilter(); }
function toggleCat(c) { state.collapsed.has(c) ? state.collapsed.delete(c) : state.collapsed.add(c); renderFilter(); }

// ================= START =================
async function start(mode) {
  state.roundMode = mode;
  subEl().textContent = "Lädt …";
  screen().innerHTML = `<div class="qc" style="text-align:center;padding:40px 0;">
    <div class="rs" style="font-size:28px;">⏳</div>
    <p class="rl">Fragen werden geladen …</p></div>`;
  try {
    if (mode === "bookmarks") {
      state.active = await buildBookmarkRound(store.getBookmarks());
    } else { // topics
      state.active = await buildRound([...state.selected], {
        genCount: state.genCount, limit: state.limitCount, useWeights: state.useWeights
      });
    }
    beginRound();
  } catch (e) {
    screen().innerHTML = `<div class="qc"><p class="filter-intro">Fehler beim Laden: ${e.message}<br><br>
      Hinweis: ES-Module brauchen einen Webserver. Auf GitHub Pages läuft es; lokal per Doppelklick (file://) nicht.</p>
      <button class="start" id="back">Zurück</button></div>`;
    byId("back").addEventListener("click", renderFilter);
  }
}

function beginRound() {
  state.ans = new Array(state.active.length).fill(null);
  state.cur = 0;
  state.view = "question";
  if (state.examMode && state.active.length > 0) {
    startTimer(state.active.length * 60, () => renderRes());
  } else {
    persistSession(); // Übungen ab Start fortsetzbar machen
  }
  renderQ();
}

// ---- Übungs-Sitzung speichern / fortsetzen (nur ohne Prüfungsmodus) ----
function persistSession() {
  if (state.examMode) return;
  store.saveSession({
    active: state.active, cur: state.cur, ans: state.ans,
    roundMode: state.roundMode, savedAt: Date.now()
  });
}

function resumeSession() {
  const s = store.getSession();
  if (!s) return renderFilter();
  state.examMode = false;
  state.active = s.active;
  state.ans = s.ans;
  state.cur = Math.min(s.cur || 0, s.active.length - 1);
  state.roundMode = s.roundMode || "topics";
  state.view = "question";
  renderQ();
}

// ---- Pause (Prüfungsmodus): Timer anhalten ----
function pauseExam() {
  if (!state.examMode || !state.timer) return;
  state.pausedRemaining = state.timer.remaining;
  stopTimer();
  renderPause();
}
function resumeExam() {
  state.view = "question";
  startTimer(state.pausedRemaining || 0, () => renderRes());
  renderQ();
}
function renderPause() {
  state.view = "paused";
  const r = Math.max(0, state.pausedRemaining || 0);
  const m = String(Math.floor(r / 60)).padStart(2, "0");
  const s = String(r % 60).padStart(2, "0");
  subEl().textContent = "Pausiert";
  screen().innerHTML = `<div class="res">
    <div class="rs" style="font-size:30px;">⏸ Pause</div>
    <div class="rl">Verbleibende Zeit: <b>${m}:${s}</b></div>
    <div class="rm">Die Uhr steht still, bis du fortfährst.</div>
    <div class="brow" style="max-width:420px;margin:0 auto;">
      <button class="btn btn-p" id="resumeExamBtn">▶ Fortsetzen</button>
      <button class="btn btn-g" id="endExamBtn">Beenden</button>
    </div>
  </div>`;
  byId("resumeExamBtn").addEventListener("click", resumeExam);
  byId("endExamBtn").addEventListener("click", () => renderRes());
}

// ================= FRAGE =================
function renderQ() {
  if (state.cur >= state.active.length) return renderRes();
  state.view = "question";
  const q = state.active[state.cur];
  const a = state.ans[state.cur];
  const exam = state.examMode;
  const answered = a !== null;
  const reveal = answered && !exam; // im Prüfungsmodus keine Auflösung
  subEl().textContent = `Frage ${state.cur + 1} von ${state.active.length}${exam ? " · Prüfungsmodus" : ""}`;

  const star = q.id
    ? `<button class="star ${store.isBookmarked(q.id) ? "on" : ""}" id="starBtn" title="Merken (Taste B)">${store.isBookmarked(q.id) ? "★" : "☆"}</button>`
    : "";

  let h = `<div class="pbar"><div class="pfill" style="width:${(state.cur / state.active.length) * 100}%"></div></div>
    <div class="qc">
      <div class="qhead">
        <span class="tag">${q.topic}</span>
        ${star}
        ${exam ? `<span class="timer" id="timer">⏱ --:--</span><button class="icon-btn pause" id="pauseBtn" title="Pause (Taste P)">⏸</button>` : ""}
      </div>
      <div class="qnum">Frage ${state.cur + 1} / ${state.active.length}</div>
      <div class="qt">${q.text}</div>`;

  if (q.type === "tf") {
    ["Wahr", "Falsch"].forEach((lab, idx) => {
      const bv = idx === 0; let c = "opt";
      if (reveal) { c += " dis"; if (bv === a.choice) c += " sel"; if (bv === q.correct) c += " cor"; else if (bv === a.choice && bv !== q.correct) c += " wr"; }
      else if (answered && exam && bv === a.choice) c += " sel";
      const m = reveal && bv === q.correct ? "✓" : (reveal && bv === a.choice && bv !== q.correct ? "✗" : "");
      h += `<div class="${c}" data-tf="${bv}"><div class="ob">${m}</div><div class="ot">${lab}</div><span class="kbd">${idx + 1}</span></div>`;
    });
  } else if (q.type === "mc") {
    q.options.forEach((o, idx) => {
      let c = "opt";
      if (reveal) { c += " dis"; if (idx === a.choice) c += " sel"; if (idx === q.correct) c += " cor"; else if (idx === a.choice && idx !== q.correct) c += " wr"; }
      else if (answered && exam && idx === a.choice) c += " sel";
      const L = String.fromCharCode(65 + idx);
      const m = reveal && idx === q.correct ? "✓" : (reveal && idx === a.choice && idx !== q.correct ? "✗" : "");
      h += `<div class="${c}" data-mc="${idx}"><div class="ob">${m}</div><div class="ot"><span class="ol">${L})</span>${o}</div><span class="kbd">${idx + 1}</span></div>`;
    });
  } else { // in
    const ic = reveal ? (a.correct ? "cor" : "wr") : "";
    const iv = answered ? a.value : "";
    h += `<div class="ia"><input id="ta" class="${ic}" placeholder="${q.placeholder || "Antwort"}" value="${iv}" ${answered ? "disabled" : ""} autocomplete="off" autocapitalize="off" spellcheck="false"><div class="hint">💡 ${q.hint || ""}</div></div>`;
  }

  if (reveal) {
    let pre = "";
    if (q.type === "in") pre = a.correct ? "<b>✓ Richtig!</b> " : "<b>✗ Nicht ganz.</b> ";
    h += `<div class="exp show">${pre}${q.explain}</div>`;
  }

  // Button-Reihe
  h += `<div class="brow">`;
  const last = state.cur === state.active.length - 1;
  if (exam) {
    if (q.type === "in") h += `<button class="btn btn-p" id="checkBtn">${last ? "Abgeben" : "Weiter →"}</button>`;
    else h += `<button class="btn btn-p" id="nextBtn" ${answered ? "" : "disabled"}>${last ? "Abgeben" : "Weiter →"}</button>`;
  } else {
    if (q.type === "in" && !answered) h += `<button class="btn btn-p" id="checkBtn">Prüfen</button>`;
    else if (answered) h += `<button class="btn btn-p" id="nextBtn">${last ? "Ergebnis" : "Weiter →"}</button>`;
    h += `<button class="btn btn-g" id="laterBtn" title="Speichern und später fortfahren">⏸ Später</button>`;
  }
  h += `<button class="btn btn-g" id="toFilter">Themen</button></div></div>`;

  screen().innerHTML = h;
  if (exam) renderTimer(); else persistSession();

  // Events
  screen().querySelectorAll("[data-tf]").forEach(el =>
    el.addEventListener("click", () => { if (state.ans[state.cur] === null) answer(el.dataset.tf === "true"); }));
  screen().querySelectorAll("[data-mc]").forEach(el =>
    el.addEventListener("click", () => { if (state.ans[state.cur] === null) answer(parseInt(el.dataset.mc)); }));
  const cb = byId("checkBtn"); if (cb) cb.addEventListener("click", submitInput);
  const nb = byId("nextBtn"); if (nb) nb.addEventListener("click", goNext);
  const stb = byId("starBtn"); if (stb) stb.addEventListener("click", () => toggleStar(q));
  const pb = byId("pauseBtn"); if (pb) pb.addEventListener("click", pauseExam);
  const lb = byId("laterBtn"); if (lb) lb.addEventListener("click", () => { persistSession(); renderFilter(); });
  byId("toFilter").addEventListener("click", renderFilter);

  if (q.type === "in" && !answered) {
    const inp = byId("ta");
    if (inp) { inp.addEventListener("keydown", e => { if (e.key === "Enter") submitInput(); }); setTimeout(() => inp.focus(), 40); }
  }
}

function toggleStar(q) {
  if (!q.id) return;
  store.toggleBookmark(q.id);
  const stb = byId("starBtn");
  if (!stb) return;
  const on = store.isBookmarked(q.id);
  stb.classList.toggle("on", on);
  stb.textContent = on ? "★" : "☆";
}

function goNext() { state.cur++; renderQ(); }

// nimmt Antwort für tf/mc entgegen
function answer(choice) {
  const q = state.active[state.cur];
  const correct = choice === q.correct;
  state.ans[state.cur] = { choice, correct };
  recordAnswer(q, correct);
  if (state.examMode) goNext(); else renderQ();
}

function submitInput() {
  const el = byId("ta");
  if (!el) return;
  const q = state.active[state.cur];
  const ok = checkInput(q, el.value);
  state.ans[state.cur] = { value: el.value.replace(/"/g, "&quot;"), correct: ok };
  recordAnswer(q, ok);
  if (state.examMode) goNext(); else renderQ();
}

// schreibt Lernstand + Karteikarten-Gewicht (nur statische Fragen haben eine id)
function recordAnswer(q, correct) {
  store.recordResult(q.topic, correct);
  if (q.id) store.recordWeight(q.id, correct);
}

// ================= ERGEBNIS =================
function renderRes() {
  state.view = "result";
  stopTimer();
  if (!state.examMode) store.clearSession(); // abgeschlossene Übung ist nicht mehr fortsetzbar
  const tot = state.active.length;
  const sc = state.ans.filter(a => a && a.correct).length;
  const pct = tot ? Math.round(sc / tot * 100) : 0;
  subEl().textContent = "Abgeschlossen";

  let msg;
  if (pct === 100) msg = "🏆 Perfekt!";
  else if (pct >= 85) msg = "💪 Stark – fast prüfungsreif!";
  else if (pct >= 70) msg = "👍 Gute Basis.";
  else if (pct >= 50) msg = "📚 Solider Anfang.";
  else msg = "🔁 Dranbleiben!";

  // Statistik pro Thema
  const bt = {};
  state.active.forEach((q, i) => {
    if (!bt[q.topic]) bt[q.topic] = { ok: 0, t: 0 };
    bt[q.topic].t++;
    if (state.ans[i] && state.ans[i].correct) bt[q.topic].ok++;
  });
  let st = "";
  Object.keys(bt).sort().forEach(t => {
    const b = bt[t]; const p = Math.round(b.ok / b.t * 100);
    st += `<div class="tsr"><span>${t}</span><div class="bbg"><div class="bf" style="width:${p}%"></div></div><b>${b.ok}/${b.t}</b></div>`;
  });

  // falsch beantwortete Fragen merken (für Wiederholungsrunde)
  state.wrong = state.active.filter((q, i) => !(state.ans[i] && state.ans[i].correct));

  // Im Prüfungsmodus: Auflösung als Review-Liste
  let review = "";
  if (state.examMode) {
    let items = "";
    state.active.forEach((q, i) => {
      const a = state.ans[i];
      const ok = a && a.correct;
      let your = "—";
      if (a) {
        if (q.type === "tf") your = a.choice ? "Wahr" : "Falsch";
        else if (q.type === "mc") your = q.options[a.choice];
        else your = a.value || "—";
      }
      items += `<div class="rev-item ${ok ? "ok" : "no"}">
        <div class="rev-q">${i + 1}. ${q.text}</div>
        <div class="rev-meta">${ok ? "✓ richtig" : "✗ deine Antwort: " + your} — ${q.explain}</div>
      </div>`;
    });
    review = `<div class="review">${items}</div>`;
  }

  const wrongCount = state.wrong.length;
  screen().innerHTML = `<div class="res">
    <div class="rs">${sc}/${tot}</div><div class="rl">${pct}% richtig</div><div class="rm">${msg}</div>
    <div class="brow" style="max-width:460px;margin:0 auto;">
      <button class="btn btn-p" id="again">Neue Runde</button>
      ${wrongCount ? `<button class="btn btn-g" id="repeat">Falsche wiederholen (${wrongCount})</button>` : ""}
      <button class="btn btn-g" id="change">Themen</button>
    </div>
    <div class="tstats">${st}</div>
    ${review}
  </div>`;

  byId("again").addEventListener("click", () => start(state.roundMode === "bookmarks" ? "bookmarks" : "topics"));
  byId("change").addEventListener("click", renderFilter);
  const rp = byId("repeat");
  if (rp) rp.addEventListener("click", () => { state.active = buildRepeat(state.wrong); beginRound(); });
}

// ================= TASTATURSTEUERUNG =================
document.addEventListener("keydown", e => {
  // Im Pausen-Screen: Enter/Leertaste setzt fort
  if (state.view === "paused") {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); resumeExam(); }
    return;
  }
  if (state.view !== "question") return;
  const q = state.active[state.cur];
  if (!q) return;
  const answered = state.ans[state.cur] !== null;
  const inInput = document.activeElement && document.activeElement.id === "ta";

  // P = Pause im Prüfungsmodus
  if (!inInput && state.examMode && (e.key === "p" || e.key === "P")) { e.preventDefault(); pauseExam(); return; }

  // B = merken (sofern Eingabefeld nicht fokussiert)
  if (!inInput && (e.key === "b" || e.key === "B")) { if (q.id) toggleStar(q); return; }

  // Im Eingabefeld nur Enter (vom Input-Listener behandelt) – Rest ignorieren
  if (inInput) return;

  if (!answered) {
    if (q.type === "mc") {
      const n = parseInt(e.key);
      if (n >= 1 && n <= q.options.length) { e.preventDefault(); answer(n - 1); }
    } else if (q.type === "tf") {
      if (e.key === "1" || e.key.toLowerCase() === "w") { e.preventDefault(); answer(true); }
      else if (e.key === "2" || e.key.toLowerCase() === "f") { e.preventDefault(); answer(false); }
    }
  } else if (e.key === "Enter" || e.key === " ") {
    const nb = byId("nextBtn");
    if (nb && !nb.disabled) { e.preventDefault(); goNext(); }
  }
});
