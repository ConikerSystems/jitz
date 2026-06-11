# HANDOFF — resume notes for the next session
_Updated 2026-06-11 · Jitz · local (Mac)_

**Start here:** check git sync (Claude does all git — sync at start, push at end), then read
this, then `CLAUDE.md`.

## Where things stand
- Version **1.1.1**; service-worker cache **jitz-v13**. Version source:
  `static/js/version.js` (`window.APP_VERSION`).
- Pushed to `github.com/ConikerSystems/jitz` (origin/main). Hosted at
  `conikersystems.github.io/jitz/`.

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
- Content: add more techniques to `moves.json` as curated (the rate-your-sources panel is already
  wired and surfaces top instructors).
- If About copy changes, regenerate `jitz-about.pdf` (headless Chrome `--print-to-pdf` of
  `about.html`, served from the jitz/ folder).

## How to run / test
- Serve locally from `jitz/`: `python3 -m http.server 8811 --directory .` → open
  `http://localhost:8811/`. (Videos are cross-origin YouTube and need the network; the shell
  works offline once installed.)
