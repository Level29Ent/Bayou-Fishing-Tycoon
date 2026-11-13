# Bayou Fishing Tycoon — The Living Bayou

A dependency-free, single-player browser fishing game with a locally drawn perspective landscape. Open `bayou_fishing_tycoon.html` in a modern browser, or serve this directory with any static HTTP server. Vercel serves the game at `/` through `vercel.json`.

## Play

- **Move:** WASD, arrows, or tap/hold the on-screen steering controls.
- **Aim:** click/tap the water. Surface feeding rings improve rare-fish odds.
- **Cast/reel:** use the main button or Space. Wait for a bite, then make three pulls while the marker is in green. Pulling outside green increases tension; 100% tension loses the fish. There is no reeling time limit.
- **Progress:** sell your livewell, buy equipment, hire income-producing guides, claim contracts, and unlock four regions. The merged city expansion is retained: open Region map for Cypress City, Belle Rive and Port Soleil, paid passages, local market multipliers and a zoomable city chart. Belle Rive Riverfront and Soleil Harbor offer free public fishing. The Contracts menu also contains repeatable delivery jobs.
- **Discover:** 18 species have different habitats and feeding conditions. A full day lasts 24 active minutes; weather changes every 90 active seconds. Menus pause exploration, the clock and reeling.
- **Sound:** optional synthesized water ambience, off by default. No audio or visual assets are downloaded.

## Saves

The `bayouTycoonSave` localStorage key is retained from the original game. Existing cash, level, equipment, unlocked locations and inventory sale values are preserved, including active city delivery contracts and completed delivery counts. Old inventory names seed the new journal where possible. Historical sold catches cannot reconstruct a species journal because the original save did not record them.

Progress is browser- and origin-local, not cloud-synced. Preview and production saves are separate. Crew income is capped at ten minutes per absence. The $100 supplies grant resets on the UTC calendar date. If localStorage is unavailable, gameplay continues but progress cannot persist.

## Structure and checks

- `game-core.js`: save migration and deterministic game rules; also loadable with Node `require` for focused checks.
- `world.js`: Canvas 2D perspective renderer, scenery and boat movement.
- `game.js`: browser events, menus, fishing flow and local save lifecycle.
- `game.css`: desktop and phone layout; reduced-motion scenery support.

No package install or build step is required. Syntax checks:

```sh
node --check game-core.js
node --check world.js
node --check game.js
git diff --check
```

This is a stylized Louisiana-inspired environment, not photorealistic 3D, multiplayer, or a geographic simulation. Fish sizes, prices, habitats and behavior are gameplay balancing, not a fishing reference.
