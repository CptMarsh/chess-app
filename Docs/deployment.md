---
type: component
title: Deployment
description: The build of the app, the base path and the GitHub Actions workflow that publishes the app on GitHub Pages.
resource: .github/workflows/deploy.yml
tags: [deploy, github-pages, github-actions, build, vite]
---

# Deployment

The app is published at `https://cptmarsh.github.io/chess-app/`. Each push to `trunk` tests the app, builds it and publishes it. The build holds no Lichess token. Each person pastes their own token in the [token dialog](token.md).

## Build
- `npm run build` runs `vite build`. It makes `dist/`.
- `vite.config.ts` sets `base: "/chess-app/"`, because GitHub Pages serves a project page under the name of the repository. The dev server and the e2e tests use the same base, for example `http://localhost:5173/chess-app/`.
- Each path in the code must start with `import.meta.env.BASE_URL`, not with `/`. For example, `src/main.ts` makes the Stockfish Worker with `` `${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js` ``.
- `npm ci` runs the `postinstall` script, which copies Stockfish to `public/stockfish/`. Vite copies `public/` into `dist/`.
- GitHub Pages cannot set COOP and COEP headers. The app uses `stockfish-19-lite-single`, which needs no `SharedArrayBuffer`. Thus the app needs no headers. A multi-thread Stockfish build would not work on GitHub Pages.

## Workflow (`.github/workflows/deploy.yml`)
The workflow runs on each push to `trunk`, and by hand from the **Actions** tab (`workflow_dispatch`).

| Job | Steps |
|---|---|
| `build` | Check out. Set up Node from `.nvmrc`, with the npm cache. `npm ci`. `npm run typecheck`. `npm test`. `npx playwright install --with-deps chromium`. `npm run e2e`. `npm run build`. Upload `dist/` as the Pages artifact. |
| `deploy` | Needs `build`. Publishes the artifact to the `github-pages` environment. Its URL is the address of the app. |

If a check fails, the workflow does not publish, and the last published app stays.

Permissions: `contents: read`, `pages: write` and `id-token: write`. The concurrency group is `pages`, with `cancel-in-progress: false`: a deploy that runs is not stopped.

## Setup (one time)
In the repository on GitHub, open **Settings → Pages**. Under **Build and deployment**, set **Source** to **GitHub Actions**. Without this, the `deploy` job fails.

## Try the build locally
Run `npm run build`, then `npx vite preview`. Open `http://localhost:4173/chess-app/`.
