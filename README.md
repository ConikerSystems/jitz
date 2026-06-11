# Jitz

A personal study tool for **Royce Gracie Jiu-Jitsu** — the foundational
**Gracie Combatives** curriculum (36 essential techniques across 23 classes).

Browse every move by position and category, and watch the technique on an
embedded YouTube video. Your progress — **Not started / Started / Completed** —
is stored on your device only (localStorage); no account, no server.

Jitz is a **static installable web app (PWA)**: it renders the move grid from
`moves.json` in the browser, installs to the home screen via Safari's
*Add to Home Screen*, and the interface works offline. Videos themselves still
need an internet connection.

## Run locally

It's just static files — serve the folder with any static server:

```bash
python3 -m http.server 5009     # then open http://127.0.0.1:5009
```

Part of the **Claude Hub** family.

## Hosting

Published with **GitHub Pages** from the repo root. The site lives at
`https://conikersystems.github.io/jitz/`. All asset paths are relative so it works
under the `/jitz/` project sub-path.

## Files

- `index.html` — app shell; `static/js/app.js` builds the cards from `moves.json`.
- `about.html` — about page.
- `manifest.webmanifest`, `sw.js`, `icons/` — PWA manifest, service worker, app icons.
- `moves.json` — the 36 techniques. Lessons 1–20 have **verified, embeddable**
  YouTube links from Gracie-lineage instructors; the rest list a name / position /
  category and a "Find on YouTube" search link until a video is curated.

> Move names follow the published Gracie Combatives curriculum. Official class
> calendars rotate which techniques pair per class; the 36 core techniques are
> stable.
