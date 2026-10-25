---
type: spec
title: Publish on GitHub Pages
description: The design of the deploy. A GitHub Actions workflow tests and builds the app on each push to trunk, then publishes it on GitHub Pages.
tags: [spec, deploy, github-pages, github-actions, build]
---

# Publish on GitHub Pages

## Goal
You can use the app from any browser, without a local copy. Each push to `trunk` tests the app, builds it and publishes it at `https://cptmarsh.github.io/chess-app/`.

Success: after a push to `trunk`, the published app trains a line.

The [Ask for the Lichess token](2026-10-25-lichess-token-design.md) spec made this safe: the build holds no token.

## Decisions
| Subject | Decision |
|---|---|
| Host | GitHub Pages, with the source **GitHub Actions**. No `gh-pages` branch. |
| When | Each push to `trunk`, and by hand (`workflow_dispatch`). |
| Gate | The workflow publishes only when the typecheck, the unit tests and the e2e tests pass. |
| Address | `https://cptmarsh.github.io/chess-app/`. Thus the base path is `/chess-app/`. |
| Headers | GitHub Pages cannot set COOP and COEP headers. The app uses `stockfish-19-lite-single`, which needs no `SharedArrayBuffer`. Thus no headers are necessary. |

## Changes
| File | Change |
|---|---|
| `package.json` | The new script `build`: `vite build`. |
| `vite.config.ts` | New. `base: "/chess-app/"`. The dev server and the e2e tests also use this base. Thus the tests find a wrong path. |
| `src/main.ts` | The Worker path is `` `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js` ``. An absolute path (`/stockfish/...`) does not work under the base path. |
| `.github/workflows/deploy.yml` | New. See "Workflow". |

## Workflow (`.github/workflows/deploy.yml`)
1. Job `build`: check out, set up Node from `.nvmrc` with the npm cache, `npm ci` (its `postinstall` copies Stockfish to `public/stockfish`), `npm run typecheck`, `npm test`, `npx playwright install --with-deps chromium`, `npm run e2e`, `npm run build`, then upload `dist/` as the Pages artifact.
2. Job `deploy`: needs `build`. It publishes the artifact to the `github-pages` environment.

Permissions: `contents: read`, `pages: write`, `id-token: write`. Concurrency group `pages`: a new push does not stop a deploy that runs, but it replaces a deploy that waits.

## Setup (one time, by hand)
In the repository on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Tests
- With the base `/chess-app/`, the current e2e scenarios fail until the Worker path uses `BASE_URL`. Thus they test the path.
- `npm run build` must make `dist/index.html`, `dist/stockfish/stockfish-19-lite-single.js` and `dist/stockfish/stockfish-19-lite-single.wasm`.
