# Jitz — repo notes

**At session start:** check git sync, then read **`HANDOFF.md`** for where we left off.

This program follows the **Coniker Hub conventions**: Claude does all git (sync at start, push
when done); local/private data stays on the Mac (never pushed); web apps follow the shared
WEB_APP_STANDARDS — PWA + offline service worker, single-source version, in-app **🔄 Update**
button, `© <year> Coniker Systems™ · v<version>` footer, Coniker-standard About page, and never
trap a standalone (home-screen) app with top-level navigation.

Jitz specifics: vanilla **static PWA**, no build step; curriculum data lives in `moves.json`;
in-app YouTube player; per-device progress plus star ratings that surface top instructors. Bump
`static/js/version.js` **and** `CACHE_NAME` in `sw.js` together on every deploy.
