# HANDOFF — resume notes for the next session
_Updated 2026-06-11 · Jitz · local (Mac)_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.2.0**; service-worker cache **jitz-v14**. Version source:
  `static/js/version.js` (`window.APP_VERSION`); cache const is `VERSION` in `sw.js`.
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
- **Pending video**: `dojo-scissor-sweep-knee` (Scissor Sweep — Pushing the Knee) ships with
  `youtube: null` (a "Find on YouTube" button shows, like `rear-takedown` / `double-underhook-pass`).
  Curate a verified embeddable Gracie-lineage clip when found.
- **Verify at deploy**: the two newer video ids — `IUviW1Ejp2w` (VirtualGracie scissor sweep, the
  2nd option on the Scissor Sweep card) and `xEBzXXG4IKM` (Gun Defense Front Waistband) — confirm
  they still embed; drop/replace any that go owner-blocked. `IiT-kvqmHA0` (Gracie Charlottesville
  scissor sweep) is the primary option.
- Content: add more techniques / more per-move video options via the ratings-export curation loop
  above.
- If About copy changes, regenerate `jitz-about.pdf` (headless Chrome `--print-to-pdf` of
  `about.html`, served from the jitz/ folder).

## How to run / test
- Serve locally from `jitz/`: `python3 -m http.server 8811 --directory .` → open
  `http://localhost:8811/`. (Videos are cross-origin YouTube and need the network; the shell
  works offline once installed.)
