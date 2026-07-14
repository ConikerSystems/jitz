# HANDOFF — resume notes for the next session
_Updated 2026-06-11 · Jitz · local (Mac)_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.5.0**; service-worker cache **jitz-v19**. Version source:
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

## How to run / test
- Serve locally from `jitz/`: `python3 -m http.server 8811 --directory .` → open
  `http://localhost:8811/`. (Videos are cross-origin YouTube and need the network; the shell
  works offline once installed.)
