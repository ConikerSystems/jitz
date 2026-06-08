// Jitz — static client: render moves from moves.json, filter/search, in-app
// YouTube player, and per-device progress (Not started / Started / Completed).

const PROGRESS_KEY = "jitz.progress";   // { id: "started" | "done" }
const OLD_WATCHED_KEY = "jitz.watched"; // legacy Set of ids -> migrated to "done"
const RATINGS_KEY = "jitz.ratings";     // { id: 1..5 } per-video star rating

const STATES = {
  none:    { label: "Not started", short: "○ Not started" },
  started: { label: "Started",     short: "◐ Started" },
  done:    { label: "Completed",   short: "✓ Completed" },
};
const CYCLE = { none: "started", started: "done", done: "none" };

// ---- Progress storage (with one-time migration from the old binary key) ----
function getProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* fall through */ }
  // Migrate legacy "watched" ids -> "done".
  try {
    const old = JSON.parse(localStorage.getItem(OLD_WATCHED_KEY) || "[]");
    if (Array.isArray(old) && old.length) {
      const migrated = {};
      old.forEach((id) => { migrated[id] = "done"; });
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (e) { /* ignore */ }
  return {};
}
function saveProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
function stateOf(id) { return getProgress()[id] || "none"; }
function setState(id, state) {
  const p = getProgress();
  if (state === "none") delete p[id]; else p[id] = state;
  saveProgress(p);
  applyProgress();
}

// ---- Ratings (per-video, 1-5 stars; powers the "top sources" insights) ----
function getRatings() {
  try { return JSON.parse(localStorage.getItem(RATINGS_KEY) || "{}"); }
  catch (e) { return {}; }
}
function saveRatings(r) { localStorage.setItem(RATINGS_KEY, JSON.stringify(r)); }
function ratingOf(id) { return getRatings()[id] || 0; }
function setRating(id, n) {
  const r = getRatings();
  if (!n) delete r[id]; else r[id] = n;
  saveRatings(r);
  applyRatings();
}
// Clicking the current rating again clears it.
function rateClick(id, star) { setRating(id, star === ratingOf(id) ? 0 : star); }

function starButtons(id) {
  let s = "";
  for (let n = 1; n <= 5; n++) {
    s += `<button class="star" data-act="rate" data-id="${esc(id)}" data-star="${n}" ` +
         `aria-label="Rate ${n} of 5">★</button>`;
  }
  return s;
}

function applyRatings() {
  const r = getRatings();
  document.querySelectorAll(".stars").forEach((group) => {
    const rating = r[group.dataset.rateId] || 0;
    group.querySelectorAll(".star").forEach((st) => {
      st.classList.toggle("on", parseInt(st.dataset.star, 10) <= rating);
    });
  });
  buildSourcesPanel();
}

// Aggregate ratings by video author so the user can see which sources they like.
function buildSourcesPanel() {
  const r = getRatings();
  const byAuthor = {};
  MOVES.forEach((m) => {
    if (m.youtube && r[m.id]) {
      const a = m.video_author || "Unknown";
      const e = (byAuthor[a] = byAuthor[a] || { sum: 0, count: 0 });
      e.sum += r[m.id];
      e.count += 1;
    }
  });
  const rows = Object.entries(byAuthor)
    .map(([author, v]) => ({ author, avg: v.sum / v.count, count: v.count }))
    .sort((x, y) => y.avg - x.avg || y.count - x.count);

  const panel = document.getElementById("sources-panel");
  const list = document.getElementById("sources-list");
  if (!panel || !list) return;
  if (!rows.length) { panel.classList.add("hidden"); return; }
  panel.classList.remove("hidden");
  list.innerHTML = rows.map((row) => {
    const full = Math.round(row.avg);
    const stars = "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
    return `<div class="source-row"><span class="source-name">${esc(row.author)}</span>` +
           `<span class="source-stars">${stars}</span>` +
           `<span class="source-meta">${row.avg.toFixed(1)} · ${row.count} rated</span></div>`;
  }).join("");
}

// ---- Render ----
let MOVES = [];

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function cardHTML(m) {
  const hasVideo = !!m.youtube;
  const catClass = "cat-" + String(m.category).toLowerCase();
  const lesson = m.lesson ? ` · Lesson ${m.lesson}` : "";
  const dataVideo = hasVideo
    ? ` data-yt="${esc(m.youtube)}" data-vtitle="${esc(m.video_title)}" data-vauthor="${esc(m.video_author)}"`
    : "";
  const searchHref = "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(`Gracie Jiu-Jitsu ${m.name} ${m.position}`);
  const action = hasVideo
    ? `<button class="btn btn-watch" data-act="watch" data-id="${esc(m.id)}">▶ Watch</button>`
    : `<a class="btn btn-search yt-out" target="_blank" href="${esc(searchHref)}">Find on YouTube ↗</a>`;
  return `
  <div class="move-card${hasVideo ? "" : " no-video"}"
       data-id="${esc(m.id)}"
       data-name="${esc(String(m.name).toLowerCase())}"
       data-pos="${esc(String(m.position).toLowerCase())}"
       data-cat="${esc(m.category)}"
       data-video="${hasVideo ? "1" : "0"}"${dataVideo}>
    <div class="move-top">
      <span class="move-order">${esc(m.order)}</span>
      <span class="cat-badge ${catClass}">${esc(m.category)}</span>
      <span class="status-dot" title=""></span>
    </div>
    <div class="move-name">${esc(m.name)}</div>
    <div class="move-pos">${esc(m.position)}${lesson}</div>
    <div class="move-actions">
      ${action}
      <button class="btn btn-status" data-act="status" data-id="${esc(m.id)}"></button>
    </div>
    ${hasVideo ? `<div class="stars" data-rate-id="${esc(m.id)}">${starButtons(m.id)}</div>` : ""}
  </div>`;
}

function render(data) {
  MOVES = data.moves;
  const meta = data.meta || {};
  const total = MOVES.length;
  const withVideo = MOVES.filter((m) => m.youtube).length;

  // Header / intro / dojo
  document.getElementById("intro-source").textContent = meta.source || "";
  document.getElementById("intro-progress").textContent =
    `${withVideo} of ${total} moves have a verified video so far.`;
  const dojo = meta.dojo || {};
  const dlink = document.getElementById("dojo-link");
  if (dlink) {
    if (dojo.url) {
      dlink.href = dojo.url;
      dlink.textContent = `${dojo.name || "Dojo"} ↗`;
      if (dojo.location) dlink.title = dojo.location;
    } else {
      dlink.classList.add("hidden");
    }
  }

  // Category chips
  const cats = [...new Set(MOVES.map((m) => m.category))].sort();
  const filters = document.getElementById("filters");
  const toggle = document.getElementById("video-only");
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.cat = c;
    b.textContent = c;
    filters.insertBefore(b, toggle);
  });

  // Cards
  document.getElementById("grid").innerHTML = MOVES.map(cardHTML).join("");

  applyProgress();
  applyRatings();
  applyFilters();
}

function applyProgress() {
  const p = getProgress();
  let done = 0, started = 0;
  document.querySelectorAll(".move-card").forEach((card) => {
    const st = p[card.dataset.id] || "none";
    card.classList.remove("status-none", "status-started", "status-done");
    card.classList.add("status-" + st);
    const dot = card.querySelector(".status-dot");
    if (dot) dot.title = STATES[st].label;
    const btn = card.querySelector(".btn-status");
    if (btn) btn.textContent = STATES[st].short;
    if (st === "done") done++; else if (st === "started") started++;
  });
  const total = document.querySelectorAll(".move-card").length;
  const stat = document.getElementById("progress-stat");
  if (stat) stat.textContent = `${done} done · ${started} started / ${total}`;
}

// ---- Filtering ----
let activeCat = "all";
let videoOnly = false;

function applyFilters() {
  const q = (document.getElementById("search").value || "").trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll(".move-card").forEach((card) => {
    const hay = `${card.dataset.name} ${card.dataset.pos} ${card.dataset.cat.toLowerCase()}`;
    const matchText = !q || hay.includes(q);
    const matchCat = activeCat === "all" || card.dataset.cat === activeCat;
    const matchVideo = !videoOnly || card.dataset.video === "1";
    const show = matchText && matchCat && matchVideo;
    card.classList.toggle("hidden", !show);
    if (show) visible++;
  });
  document.getElementById("no-results").classList.toggle("hidden", visible > 0);
}

// ---- Events (delegation) ----
document.getElementById("search").addEventListener("input", applyFilters);
document.getElementById("filters").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;
  if (btn.id === "video-only") {
    videoOnly = !videoOnly;
    btn.classList.toggle("active", videoOnly);
  } else {
    activeCat = btn.dataset.cat;
    document.querySelectorAll(".chip:not(.chip-toggle)").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
  }
  applyFilters();
});
document.getElementById("grid").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.act === "status") {
    setState(id, CYCLE[stateOf(id)]);
  } else if (btn.dataset.act === "watch") {
    openVideo(id);
  } else if (btn.dataset.act === "rate") {
    rateClick(id, parseInt(btn.dataset.star, 10));
  }
});
// Star clicks inside the player modal.
document.getElementById("player").addEventListener("click", (e) => {
  const st = e.target.closest(".star");
  if (st) rateClick(st.dataset.id, parseInt(st.dataset.star, 10));
});

// ---- Player ----
let currentMoveId = null;

function openVideo(id) {
  const card = document.querySelector(`.move-card[data-id="${CSS.escape(id)}"]`);
  if (!card || !card.dataset.yt) return;
  currentMoveId = id;
  document.getElementById("player-iframe").src =
    `https://www.youtube-nocookie.com/embed/${card.dataset.yt}?rel=0&autoplay=1&modestbranding=1`;
  document.getElementById("player-title").textContent = card.querySelector(".move-name").textContent;
  document.getElementById("player-sub").textContent =
    `${card.dataset.vtitle} — ${card.dataset.vauthor}`;
  document.getElementById("player-yt").href = `https://www.youtube.com/watch?v=${card.dataset.yt}`;
  // Star rating row for this video.
  const ps = document.getElementById("player-stars");
  ps.dataset.rateId = id;
  ps.innerHTML = starButtons(id);
  applyRatings();
  document.getElementById("player").classList.remove("hidden");
  // Opening a video implies you've at least started it.
  if (stateOf(id) === "none") setState(id, "started");
}

function closeVideo() {
  document.getElementById("player-iframe").src = ""; // stop playback
  document.getElementById("player").classList.add("hidden");
  currentMoveId = null;
}
function closeVideoBackdrop(e) { if (e.target.id === "player") closeVideo(); }
function setFromPlayer(state) { if (currentMoveId) setState(currentMoveId, state); }
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVideo(); });

// ---- Hide outbound YouTube links on iPhone/iPad (kept on Mac/desktop) ----
// The embedded player still works; this only removes links that open the full
// YouTube site/app. iPadOS reports as "Mac" but has touch points, so check both.
const ua = navigator.userAgent || "";
const isAppleTouch =
  /iPhone|iPad|iPod/.test(ua) ||
  (/Mac/.test(navigator.platform || ua) && navigator.maxTouchPoints > 1);
if (isAppleTouch) document.body.classList.add("hide-yt");

// ---- Boot ----
fetch("moves.json", { cache: "no-cache" })
  .then((r) => r.json())
  .then(render)
  .catch((err) => {
    document.getElementById("grid").innerHTML =
      `<p class="no-results">Couldn't load moves.json. ${esc(err.message || err)}</p>`;
  });

// ---- Service worker ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline-only feature; ignore */ });
  });
}
