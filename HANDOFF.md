# HANDOFF — resume notes for the next session
_Updated 2026-06-11 · Jitz · local (Mac)_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.4.0**; service-worker cache **jitz-v17**. Version source:
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
- **In progress — Combatives 2nd video options**: a research workflow gathered lineage-first
  candidate videos for all 46 moves (saved at
  `scratchpad/candidates.json` this session; also in the workflow journal). The **dojo** moves are
  done (2 options each where a verified clip existed). The **~30 Combatives** candidates still need
  the same treatment: each must be **verified in the browser** (load the youtube-nocookie embed →
  confirm it plays AND is the right technique — titles mislead) before adding to `moves.json`
  `videos[]`. Drop agent dupes (some returned a video the app already has) and wrong-technique hits.
- **Only 1 card still has no video**: `double-underhook-pass`. Candidates gathered (e.g. Chewjitsu
  `OK8VEPdxzMM`) but not yet embed-verified.
- **Verify at deploy** the newer ids still embed: `IUviW1Ejp2w`, `xEBzXXG4IKM`, `a5qrg3MbEl4`,
  `7YNC9vh2WQ4`, plus the dojo 2nd-options added in 1.4.0.
- Content: keep adding per-move options via the ratings-export curation loop.
- If About copy changes, regenerate `jitz-about.pdf` (headless Chrome `--print-to-pdf` of
  `about.html`, served from the jitz/ folder).

## How to run / test
- Serve locally from `jitz/`: `python3 -m http.server 8811 --directory .` → open
  `http://localhost:8811/`. (Videos are cross-origin YouTube and need the network; the shell
  works offline once installed.)
