// Jitz — static client: render moves from moves.json, filter/search, in-app
// YouTube player, and per-device progress (Not started / Started / Completed).

const PROGRESS_KEY = "jitz.progress";   // { id: "started" | "done" }
const OLD_WATCHED_KEY = "jitz.watched"; // legacy Set of ids -> migrated to "done"
const RATINGS_KEY = "jitz.ratings";       // { videoId: 1..5 } per-VIDEO star rating
const RATINGS_MIGRATED_KEY = "jitz.ratings.v2"; // marker: move-id -> video-id remap done

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

// A move can carry several videos (multiple instructor options on one card).
// Normalize both shapes: the new `videos` array, or the legacy single-video fields.
function videosOf(m) {
  if (Array.isArray(m.videos) && m.videos.length) return m.videos;
  if (m.youtube) return [{ youtube: m.youtube, video_title: m.video_title, video_author: m.video_author }];
  return [];
}

// ---- Ratings (per-VIDEO now, 1-5 stars; keyed by YouTube id; power "top sources") ----
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

// One-time migration: ratings used to be keyed by MOVE id. Re-key each to the
// move's (single) VIDEO id so the new per-video model keeps existing stars.
// Runs once MOVES is loaded; idempotent via the marker key.
function migrateRatings() {
  if (localStorage.getItem(RATINGS_MIGRATED_KEY)) return;
  const r = getRatings();
  const byId = {};
  MOVES.forEach((m) => { byId[m.id] = m; });
  const out = {};
  Object.entries(r).forEach(([key, stars]) => {
    const m = byId[key];
    if (m) {
      const vids = videosOf(m);          // legacy moves had exactly one video
      if (vids.length === 1) out[vids[0].youtube] = stars;
      // ambiguous multi-video legacy shouldn't exist — drop if so
    } else {
      out[key] = stars;                   // already a video id (or unknown) — keep
    }
  });
  saveRatings(out);
  localStorage.setItem(RATINGS_MIGRATED_KEY, "1");
}

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
    videosOf(m).forEach((v) => {
      if (v.youtube && r[v.youtube]) {
        const a = v.video_author || "Unknown";
        const e = (byAuthor[a] = byAuthor[a] || { sum: 0, count: 0 });
        e.sum += r[v.youtube];
        e.count += 1;
      }
    });
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

// Small toast (reuses feedback.js's globally-injected .fb-toast style).
function toast(msg) {
  const t = document.createElement("div");
  t.className = "fb-toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1900);
}

// Build a paste-into-Claude export: ranked instructors + rated videos + a
// machine-readable block so a Mac session can curate more videos from them.
function buildRatingsExport() {
  const r = getRatings();
  const byAuthor = {};
  const videos = [];
  MOVES.forEach((m) => {
    videosOf(m).forEach((v) => {
      if (v.youtube && r[v.youtube]) {
        const a = v.video_author || "Unknown";
        const e = (byAuthor[a] = byAuthor[a] || { sum: 0, count: 0 });
        e.sum += r[v.youtube]; e.count += 1;
        videos.push({ id: v.youtube, move: m.id, name: m.name, author: a, stars: r[v.youtube] });
      }
    });
  });
  const instructors = Object.entries(byAuthor)
    .map(([author, v]) => ({ author, avg: +(v.sum / v.count).toFixed(2), count: v.count }))
    .sort((x, y) => y.avg - x.avg || y.count - x.count);
  const date = new Date().toISOString().slice(0, 10);
  const version = window.APP_VERSION || "?";
  const lines = [`JITZ RATINGS EXPORT · v${version} · ${date}`, ""];
  if (!instructors.length) {
    lines.push("(No ratings yet — rate some videos first.)");
    return lines.join("\n");
  }
  lines.push("Top instructors (by your stars):");
  instructors.forEach((it, i) => lines.push(`${i + 1}. ${it.author} — ${it.avg.toFixed(1)} avg · ${it.count} rated`));
  lines.push("", "Rated videos:");
  videos.slice().sort((a, b) => b.stars - a.stars).forEach((vd) => {
    const s = "★★★★★".slice(0, vd.stars) + "☆☆☆☆☆".slice(0, 5 - vd.stars);
    lines.push(`${s} ${vd.name} — ${vd.author} (${vd.id})`);
  });
  lines.push("", "Claude: parse the block below and add more embeddable videos from these instructors.");
  lines.push("===JITZ-EXPORT-JSON===");
  lines.push(JSON.stringify({ app: "jitz", version, date, instructors, videos }));
  lines.push("===END===");
  return lines.join("\n");
}

function exportRatings() {
  const payload = buildRatingsExport();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(payload)
      .then(() => toast("Ratings copied — paste them to Claude"))
      .catch(() => window.prompt("Copy your ratings, then paste them to Claude:", payload));
  } else {
    window.prompt("Copy your ratings, then paste them to Claude:", payload);
  }
}

// ---- Render ----
let MOVES = [];

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// A Watch button for one instructor's video (label by author when there are several).
function watchBtnHTML(m, v, labelAuthor) {
  const label = labelAuthor ? `▶ ${esc(v.video_author || "Watch")}` : "▶ Watch";
  return `<button class="btn btn-watch" data-act="watch" data-move="${esc(m.id)}" ` +
         `data-yt="${esc(v.youtube)}" data-vtitle="${esc(v.video_title)}" data-vauthor="${esc(v.video_author)}">${label}</button>`;
}
function starRowHTML(v) {
  return `<div class="stars" data-rate-id="${esc(v.youtube)}">${starButtons(v.youtube)}</div>`;
}

function cardHTML(m) {
  const vids = videosOf(m);
  const hasVideo = vids.length > 0;
  const catClass = "cat-" + String(m.category).toLowerCase();
  const lesson = m.lesson ? ` · Lesson ${m.lesson}` : "";
  const tags = Array.isArray(m.tags) ? m.tags : [];
  const searchHref = "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(`Gracie Jiu-Jitsu ${m.name} ${m.position}`);

  // Action row = primary control next to the status button. One video → a single
  // Watch button (+ stars below). Several videos → status only, with a stacked
  // list of Watch+stars options below. No video → Find-on-YouTube link.
  let action, optionsBlock = "";
  if (!hasVideo) {
    action = `<a class="btn btn-search yt-out" target="_blank" href="${esc(searchHref)}">Find on YouTube ↗</a>`;
  } else if (vids.length === 1) {
    action = watchBtnHTML(m, vids[0], false);
    optionsBlock = starRowHTML(vids[0]);
  } else {
    action = "";
    optionsBlock = `<div class="video-options">` +
      vids.map((v) => `<div class="vopt">${watchBtnHTML(m, v, true)}${starRowHTML(v)}</div>`).join("") +
      `</div>`;
  }

  return `
  <div class="move-card${hasVideo ? "" : " no-video"}${m.dojo ? " is-dojo" : ""}"
       data-id="${esc(m.id)}"
       data-name="${esc(String(m.name).toLowerCase())}"
       data-pos="${esc(String(m.position).toLowerCase())}"
       data-cat="${esc(m.category)}"
       data-tags="${esc(tags.join(","))}"
       data-dojo="${m.dojo ? "1" : "0"}"
       data-video="${hasVideo ? "1" : "0"}">
    <div class="move-top">
      <span class="move-order">${esc(m.order)}</span>
      <span class="cat-badge ${catClass}">${esc(m.category)}</span>
      ${m.dojo ? `<span class="dojo-flag">My Dojo</span>` : ""}
      <span class="status-dot" title=""></span>
    </div>
    <div class="move-name">${esc(m.name)}</div>
    <div class="move-pos">${esc(m.position)}${lesson}</div>
    <div class="move-actions">
      ${action}
      <button class="btn btn-status" data-act="status" data-id="${esc(m.id)}"></button>
    </div>
    ${optionsBlock}
  </div>`;
}

function render(data) {
  MOVES = data.moves;
  migrateRatings();               // move-id -> video-id ratings remap (once)
  const meta = data.meta || {};
  const total = MOVES.length;
  const withVideo = MOVES.filter((m) => videosOf(m).length).length;

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
  const cats = [...new Set(
    MOVES.flatMap((m) => [m.category, ...(Array.isArray(m.tags) ? m.tags : [])])
  )].sort();
  const filters = document.getElementById("filters");
  const toggle = document.getElementById("video-only");
  cats.forEach((c) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.cat = c;
    b.textContent = c;
    filters.insertBefore(b, toggle);
  });

  // Cards, split into a "My Dojo" group (shown first) and the Gracie Combatives list.
  const dojoMoves = MOVES.filter((m) => m.dojo);
  const otherMoves = MOVES.filter((m) => !m.dojo);
  const sectionHTML = (title, sub, moves, key) => moves.length ? `
    <section class="move-section" data-section="${key}">
      <h2 class="section-title">${title}${sub ? ` <span class="section-sub">${sub}</span>` : ""}</h2>
      <div class="move-grid">${moves.map(cardHTML).join("")}</div>
    </section>` : "";
  document.getElementById("sections").innerHTML =
    sectionHTML("🥋 My Dojo", "— techniques taught to me in person", dojoMoves, "dojo") +
    sectionHTML("Gracie Combatives", "", otherMoves, "combatives");

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
let activeGroup = "all";
let videoOnly = false;

function applyFilters() {
  const q = (document.getElementById("search").value || "").trim().toLowerCase();
  let visible = 0;
  document.querySelectorAll(".move-card").forEach((card) => {
    const tags = (card.dataset.tags || "").split(",").filter(Boolean);
    const hay = `${card.dataset.name} ${card.dataset.pos} ${card.dataset.cat.toLowerCase()}`;
    const matchText = !q || hay.includes(q);
    const matchCat = activeCat === "all" || card.dataset.cat === activeCat || tags.includes(activeCat);
    const matchGroup = activeGroup === "all" || (activeGroup === "dojo") === (card.dataset.dojo === "1");
    const matchVideo = !videoOnly || card.dataset.video === "1";
    const show = matchText && matchCat && matchGroup && matchVideo;
    card.classList.toggle("hidden", !show);
    if (show) visible++;
  });
  // Hide a section heading when none of its cards are visible.
  document.querySelectorAll(".move-section").forEach((sec) => {
    sec.classList.toggle("hidden", !sec.querySelector(".move-card:not(.hidden)"));
  });
  document.getElementById("no-results").classList.toggle("hidden", visible > 0);
}

// ---- Events (delegation) ----
document.getElementById("search").addEventListener("input", applyFilters);
// Group segmented control: All / My Dojo / Combatives (an independent filter dimension).
const groupFilter = document.getElementById("group-filter");
if (groupFilter) groupFilter.addEventListener("click", (e) => {
  const seg = e.target.closest(".seg");
  if (!seg) return;
  activeGroup = seg.dataset.group;
  groupFilter.querySelectorAll(".seg").forEach((s) => s.classList.toggle("active", s === seg));
  applyFilters();
});
// Export ratings for Claude curation (button lives in #sources-panel).
const exportBtn = document.getElementById("export-ratings");
if (exportBtn) exportBtn.addEventListener("click", exportRatings);
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
document.getElementById("sections").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-act]");
  if (!btn) return;
  const id = btn.dataset.id;
  if (btn.dataset.act === "status") {
    setState(id, CYCLE[stateOf(id)]);
  } else if (btn.dataset.act === "watch") {
    openVideo(btn);
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

function openVideo(btn) {
  const yt = btn.dataset.yt;
  if (!yt) return;
  const moveId = btn.dataset.move;
  currentMoveId = moveId;
  const card = document.querySelector(`.move-card[data-id="${CSS.escape(moveId)}"]`);
  document.getElementById("player-iframe").src =
    `https://www.youtube-nocookie.com/embed/${yt}?rel=0&autoplay=1&modestbranding=1`;
  document.getElementById("player-title").textContent =
    card ? card.querySelector(".move-name").textContent : "";
  document.getElementById("player-sub").textContent =
    `${btn.dataset.vtitle} — ${btn.dataset.vauthor}`;
  document.getElementById("player-yt").href = `https://www.youtube.com/watch?v=${yt}`;
  // Star rating row for THIS video (keyed by its YouTube id).
  const ps = document.getElementById("player-stars");
  ps.dataset.rateId = yt;
  ps.innerHTML = starButtons(yt);
  applyRatings();
  document.getElementById("player").classList.remove("hidden");
  // Opening a video implies you've at least started the move.
  if (moveId && stateOf(moveId) === "none") setState(moveId, "started");
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

// ---- Footer (auto-year + single-source version) ----
(function initFooter() {
  const f = document.getElementById("app-footer");
  if (f) {
    f.innerHTML = "© " + new Date().getFullYear()
      + ' <a href="https://conikersystems.com" target="_blank" rel="noopener">Coniker Systems™</a>'
      + '<span class="footer-sep">·</span>v' + (window.APP_VERSION || "1.0");
  }
})();

// ---- Update button: force-pull the latest version ----
// iOS often resumes an installed (Home-Screen) app from memory instead of
// reloading, so it never sees a new release. This updates the service worker,
// clears caches, and does a cache-busted reload. Needs the network.
function updateApp(btn) {
  if (!navigator.onLine) { alert("Connect to Wi-Fi or cellular, then tap Update again."); return; }
  if (btn) btn.textContent = "🔄  Updating…";
  (async () => {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update().catch(() => {})));
      }
      if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); }
    } catch (e) { /* ignore */ }
    location.href = "index.html?u=" + Date.now(); // cache-busted reload
  })();
}

// ---- Boot ----
fetch("moves.json", { cache: "no-cache" })
  .then((r) => r.json())
  .then(render)
  .catch((err) => {
    document.getElementById("sections").innerHTML =
      `<p class="no-results">Couldn't load moves.json. ${esc(err.message || err)}</p>`;
  });

// ---- Service worker ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => { /* offline-only feature; ignore */ });
  });
}
