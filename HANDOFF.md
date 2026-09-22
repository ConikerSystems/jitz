# HANDOFF — resume notes for the next session
_Updated 2026-09-21 · Jitz_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.5.3**; service-worker cache **jitz-v22**. Version source:
  `static/js/version.js` (`window.APP_VERSION`); cache const is `VERSION` in `sw.js`.
- **Update button was fixed in 1.3.1**: it now unregisters the SW, clears caches, and
  `fetch(..., {cache:"reload"})`-refreshes version.js/app.js/style.css/etc. before reloading —
  previously iOS served stale JS from its ~10-min HTTP cache (GitHub Pages `max-age=600`) so the
  app looked "not updated". A device on a pre-1.3.1 build must wait out that 10-min cache once
  (fully close app, wait ~15 min, reopen, Update) to reach 1.3.1+; after that updates are instant.
- Progress model is now a **watch count** (○ / ✓N on cards; "✓ Close & mark watched" in the player
  increments it, the red X closes without counting). Ratings (stars) live only in the player.
  Videos autoplay + loop.
- Pushed to `github.com/ConikerSystems/jitz` (origin/main). Hosted at
  `conikersystems.github.io/jitz/`.

## Ratings → "send to Claude" curation loop (how to add more videos)
- Ratings are now **per-video** (keyed by the 11-char YouTube id) in `localStorage`
  (`jitz.ratings`). The **📤 Send my ratings to Claude** button (in the Sources panel at the
  bottom of the home screen) copies a text export to the clipboard.
- When the user pastes that export here: parse the block between `===JITZ-EXPORT-JSON===` and
  `===END===`. Rank `instructors` by `avg` then `count`. For the top instructors, find more
  **embeddable** YouTube videos (bare 11-char ids) that map to curriculum moves, and **append
  them to the matching move's `videos[]` array** in `moves.json` (more options on the same card,
  per Joe's "few videos on one card, not more cards" preference). Create a new card only for a
  genuinely new move. Then bump `version.js` + `sw.js` together.
- A move can be single-video (legacy `youtube`/`video_title`/`video_author` fields) or
  multi-video (`videos: [{youtube,video_title,video_author}, …]`). `videosOf(m)` in `app.js`
  normalizes both.

## What we did (recent sessions)
- **1.5.2 + 1.5.3 (2026-09-21) — My Dojo additions from Joe's 2026-09-21 class** (commits
  `623b580`, `fec771e`). Joe sent his dojo notes (Royce Gracie Jiu Jitsu, "260921"); checked every
  item against `moves.json`. Everything was already present except two, now added as dojo cards:
  **13 `dojo-double-collar-grab-hands-apart`** (Grayson Greener BJJ, Helio Gracie SD #14,
  `QKJWZNcRYf4`) and **14 `dojo-front-choke-hip-throw`** (Grayson Greener BJJ, Helio Gracie SD #3,
  `blWuKYgGkH4`). Both verified playing in the in-app player (screenshots). Also added
  **15 `dojo-keeping-mount`** — Joe wanted "Keeping the mount position" under My Dojo too. It is a
  *separate* dojo card reusing the two videos of Combatives Lesson 3 `positional-control-mount`,
  which stays put **so the Combatives section keeps all 36 techniques**. Trade-off: watch counts
  are per move id (the two cards count separately); star ratings are per video, so they're shared.
  Joe's note "gun defense – front wristband" = existing `dojo-gun-defense-waistband` (typo).
  Live site confirmed serving v1.5.3. Dojo list is now 15 cards; app total 51 moves.
- **Adding a dojo move (recipe):** append a line after the last `dojo-*` entry in `moves.json`
  with the next `order`, `"dojo": true`, `"lesson": null` (or the class number); Helio Gracie
  Self Defense series by Grayson Greener BJJ is a good first source (`youtube.com/oembed` confirms
  title/channel; then open the card in the app to confirm it plays — the IFrame-API probe times
  out in the preview tab). Bump `version.js` + `sw.js` together.
- **1.5.1 (2026-09-15) — Update button + SW brought to the Hub standard** (ported from Axis):
  `updateApp()` first fetches `static/js/version.js?u=…` with `cache:"no-store"` and shows
  "✅ UP TO DATE — vX" or "UPDATING TO vY…"; only when newer does it unregister the SW, clear
  caches, refetch core files and `location.replace`. `sw.js` fetch handler now uses
  `fetch(req, {cache:"no-store"})` and the precache uses `new Request(u, {cache:"reload"})`
  (a plain `fetch(req)` can re-save a stale HTTP-cached file into the SW cache); maskable icons
  added to SHELL. `.gitignore` gained the Hub sensitive-files block. Verified in a local
  browser (no-store dev server); not yet checked on a real iPad.
- Adopted the Simpli Piano **web-app standard**: `static/js/version.js`; footer with auto-year +
  version (rendered by `initFooter()` in `static/js/app.js`); in-app **🔄 Update** button
  (`updateApp()`); a Share / Feedback / Update / About button row; feedback email →
  `info@conikersystems.com` (and `noFab:true`).
- Rebuilt `about.html` into the Coniker standard (hero, "What's inside" + "Who it's for" grids,
  install steps, **Open Jitz** CTA, brand line, print CSS) + a `jitz-about.pdf` flyer.
- **About → Download PDF** now does a real file download (blob → `<a download>`); **Share** sends
  the link via the share sheet (desktop copies it); no `sms:`.

## Unfinished / in progress
- None blocking.

## Next steps
- Joe's full dojo list (sent 2026-09-21) is done — every item is in the app. For future class notes, follow the recipe under "What we did".
- Still untested on a real iPad: the 1.5.1 Update button (should read "✅ UP TO DATE — v1.5.3").
- **DONE — video coverage complete (1.5.0)**: all **48 moves have a verified, embeddable video**,
  and **36 have 2–3 instructor options** on one card. Every added clip was verified in-browser
  (embeddable + correct technique) — the Combatives batch was checked with a YouTube IFrame-API
  probe (getVideoData title + onError), driven manually because the preview tab throttles background
  timers. `double-underhook-pass` (was empty) now has Chewjitsu + Submissions101.
- A few moves intentionally stay single-video (no distinct verified 2nd option found): `dojo-gangorra`,
  `dojo-club-defense-overhead`, `dojo-back-takedown-after-punch`, `dojo-headlock-defense-wide-stance`,
  `dojo-gun-defense-waistband`, `clinch-aggressive`, `elevator-sweep`, `body-fold-takedown`,
  `haymaker-punch-defense`. Fine to enrich later via the ratings-export loop.
- **Occasionally re-verify** third-party embeds still play (owners can disable embedding): the
  non-Gracie-channel adds (Sportvision Eindhoven, Roy Dean, Lane Andrews, Andre Galvao, Chewjitsu,
  Submissions101) are the most likely to change.
- Candidate research is saved at `scratchpad/candidates.json` + the workflow journal.
- If About copy changes, regenerate `jitz-about.pdf` (headless Chrome `--print-to-pdf` of
  `about.html`, served from the jitz/ folder).

## Considered but shelved
- **"Describe your position" finder** (idea from Joe, shelved 2026-07-27): a dedicated
  panel where you dictate/type a real situation ("opponent grips my right collar with his
  left hand, I trap his elbow to my chest") and get back the moves that apply, ranked, so
  you can see how to react. **Shelved because the per-move metadata is too thin to match a
  sentence against** — today a move carries only terse `name` + `position` + `category`
  (e.g. "Straight Armlock" / "Mount (top)" / "Submission"), and search is exact substring
  match on those three fields, so a plain-English description matches nothing.
- **Feasible path if revisited** (fully offline, keeps Jitz free/no-server/no-account):
  first do the content work — enrich each of the 48 moves in `moves.json` with new fields
  (scenario / opponent's action / grips / synonyms / aliases); then add the panel plus an
  **on-device weighted keyword + synonym matcher** that tokenizes the description and ranks
  moves by overlap. "True AI comprehension" (send text to an LLM) was rejected: it needs a
  backend + API key + per-use cost and breaks the offline model. The whole feature's quality
  is a function of that per-move content, so it's real authoring work, not just code.
- **Hook points for a future build:** card `data-*` attributes in `cardHTML`
  (`static/js/app.js` ~216–263) and the single `applyFilters()` engine (~342–361) — a new
  matcher would extend those rather than replace them.

## How to run / test
- Serve locally from `jitz/`: `python3 -m http.server 8811 --directory .` → open
  `http://localhost:8811/`. (Videos are cross-origin YouTube and need the network; the shell
  works offline once installed.)
