---
type: component
title: Stockfish engine
description: An adapter that judges a move with Stockfish in a Web Worker.
resource: src/engine/engine.ts
tags: [engine, stockfish]
---

# Stockfish engine

The engine is an adapter. It does not use the bus. It does not know the rules of the line. A later unit (the trainer) calls it.

`new StockfishEngine(worker)` gets the worker. The worker type is `EngineWorker`: `Pick<Worker, "postMessage" | "addEventListener">`. The constructor adds its `message` and `error` listeners, then sends `uci`. Tests give a fake worker.

The app gives it `new Worker("/stockfish/stockfish-19-lite-single.js")`.

`judge(fen, move)` gives a promise of a `Verdict` (`bestMove`, `bestScore` and `yourScore`). `move` is in UCI notation. The scores are in centipawns from the White side.

## Commands
`judge` waits for `uciok`. Then it sends these commands:

1. `ucinewgame`, `isready` (wait for `readyok`), `position fen <fen>`, `go depth 16`. The last `score` before `bestmove` gives `bestScore`. The `bestmove` gives `bestMove`.
2. If `move` is not `bestMove`: `position fen <fen>`, `go depth 16 searchmoves <move>`. This gives `yourScore`. If not, `yourScore` is `bestScore`.

A line without ` score ` does not change the score.

| Score | Value |
|---|---|
| `score cp <n>` | `n` |
| `score mate <n>`, `n` more than 0 | `10000` |
| `score mate <n>`, `n` 0 or less | `-10000` |

White is always the side to move, so the scores are from the White side.

## Errors
After an `error` event of the worker, the current `judge` and each later `judge` throws `Error("The engine did not start. Reload the page.")`. The engine does not try again.

## Setup
- The `stockfish` package is GPL-3.0 licensed.
- `npm install` runs `scripts/copy-stockfish.js` (the `postinstall` script). It copies `stockfish-19-lite-single.js` and `stockfish-19-lite-single.wasm` from `node_modules/stockfish/bin/` to `public/stockfish/`. Git ignores `public/stockfish`.

## Notes
- `judge` must not run two times at the same time. The trainer waits for the end of one `judge` before the next.
- The code uses `async` and `await` inside, because it wraps the worker.
