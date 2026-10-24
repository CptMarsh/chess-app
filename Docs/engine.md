---
type: component
title: Stockfish engine
description: An adapter that examines a position and scores a move with Stockfish in a Web Worker.
resource: src/engine/engine.ts
tags: [engine, stockfish]
---

# Stockfish engine

The engine is an adapter. It does not use the bus. It does not know the rules of the line. A later unit (the trainer) calls it.

`new StockfishEngine(worker)` gets the worker. The worker type is `EngineWorker`: `Pick<Worker, "postMessage" | "addEventListener">`. The constructor adds its `message` and `error` listeners, then sends `uci`. Tests give a fake worker.

The app gives it `new Worker("/stockfish/stockfish-19-lite-single.js")`.

The engine has 2 calls. Both give a promise. The scores are in centipawns from the side to move.

| Call | Result |
|---|---|
| `analyse(fen)` | An `Analysis`: `{ bestMove, score }`. `bestMove` is in UCI notation. |
| `score(fen, move)` | The score of `move` (UCI notation) in the position. |

## Commands
Both calls wait for `uciok`. Then they send these commands:

| Call | UCI commands |
|---|---|
| `analyse(fen)` | `ucinewgame`, `isready` (wait for `readyok`), `position fen <fen>`, `go depth 16` |
| `score(fen, move)` | `position fen <fen>`, `go depth 16 searchmoves <move>` |

The last `score` before `bestmove` gives the score. The `bestmove` gives `bestMove`.

A line without ` score ` does not change the score.

| Score | Value |
|---|---|
| `score cp <n>` | `n` |
| `score mate <n>`, `n` more than 0 | `10000` |
| `score mate <n>`, `n` 0 or less | `-10000` |

The side to move is always your side, so the scores are from your side.

## Errors
After an `error` event of the worker, the current call and each later call throws `Error("The engine did not start. Reload the page.")`. The engine does not try again.

## Setup
- The `stockfish` package is GPL-3.0 licensed.
- `npm install` runs `scripts/copy-stockfish.js` (the `postinstall` script). It copies `stockfish-19-lite-single.js` and `stockfish-19-lite-single.wasm` from `node_modules/stockfish/bin/` to `public/stockfish/`. Git ignores `public/stockfish`.

## Notes
- `analyse` and `score` must not run at the same time. The trainer waits for the end of one call before the next.
- `score` must run after `analyse` of the same position. The trainer does this.
- The code uses `async` and `await` inside, because it wraps the worker.
