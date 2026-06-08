// Jitz — client logic: filter/search, in-app YouTube player, watched progress.

const WATCHED_KEY = "jitz.watched";

function getWatched() {
  try { return new Set(JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]")); }
  catch (e) { return new Set(); }
}
function saveWatched(set) {
  localStorage.setItem(WATCHED_KEY, JSON.stringify([...set]));
}

function applyWatchedClasses() {
  const watched = getWatched();
  let count = 0;
  document.querySelectorAll(".move-card").forEach((card) => {
    const on = watched.has(card.dataset.id);
    card.classList.toggle("watched", on);
    if (on) count++;
  });
  const total = document.querySelectorAll(".move-card").length;
  const stat = document.getElementById("progress-stat");
  if (stat) stat.textContent = `${count} / ${total} watched`;
}

function toggleWatched(id) {
  const watched = getWatched();
  if (watched.has(id)) watched.delete(id); else watched.add(id);
  saveWatched(watched);
  applyWatchedClasses();
}

function setWatched(id) {
  const watched = getWatched();
  watched.add(id);
  saveWatched(watched);
  applyWatchedClasses();
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

// ---- Player ----
let currentMoveId = null;

function openVideo(id) {
  const card = document.querySelector(`.move-card[data-id="${id}"]`);
  if (!card || !card.dataset.yt) return;
  currentMoveId = id;
  document.getElementById("player-iframe").src =
    `https://www.youtube.com/embed/${card.dataset.yt}?rel=0&autoplay=1`;
  document.getElementById("player-title").textContent = card.querySelector(".move-name").textContent;
  document.getElementById("player-sub").textContent =
    `${card.dataset.vtitle} — ${card.dataset.vauthor}`;
  document.getElementById("player-yt").href = `https://www.youtube.com/watch?v=${card.dataset.yt}`;
  document.getElementById("player").classList.remove("hidden");
}

function closeVideo() {
  document.getElementById("player-iframe").src = ""; // stop playback
  document.getElementById("player").classList.add("hidden");
  currentMoveId = null;
}
function closeVideoBackdrop(e) {
  if (e.target.id === "player") closeVideo();
}
function markFromPlayer() {
  if (currentMoveId) setWatched(currentMoveId);
}
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeVideo(); });

applyWatchedClasses();
applyFilters();
