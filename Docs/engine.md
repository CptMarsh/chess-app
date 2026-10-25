---
type: component
title: Stockfish engine
description: An adapter that examines a position and scores a move with Stockfish in a Web Worker.
resource: src/engine/engine.ts
tags: [engine, stockfish, queue]
---

# Stockfish engine

The engine is an adapter. It does not use the bus. It does not know the rules of the line. A later unit (the trainer) calls it.

`new StockfishEngine(worker)` gets the worker. The worker type is `EngineWorker`: `Pick<Worker, "postMessage" | "addEventListener">`. The constructor adds its `message` and `error` listeners, then sends `uci`. Tests give a fake worker.

The app gives it `` new Worker(`${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`) ``. `BASE_URL` is the base path (`/chess-app/`). An absolute path does not work under the base path. See [Deployment](deployment.md).

The engine has 2 calls. Both give a promise. The scores are in centipawns from the side to move.

| Call | Result |
|---|---|
| `analyse(fen)` | The candidates: `Candidate[]`, best first. A `Candidate` is `{ move, score, line }`. `move` is in UCI notation. `line` is the engine continuation in UCI, and its first move is `move`. There are a maximum of 3 candidates. A position with fewer than 3 legal moves gives fewer candidates. |
| `score(fen, move)` | The `Candidate` of `move` (UCI notation) in the position: `{ move, score, line }`. |

## Commands
Both calls wait for `uciok`. Then they send these commands:

| Call | UCI commands |
|---|---|
| `analyse(fen)` | `setoption name MultiPV value 3`, `ucinewgame`, `isready` (wait for `readyok`), `position fen <fen>`, `go depth 16` |
| `score(fen, move)` | `position fen <fen>`, `go depth 16 searchmoves <move>` |

With MultiPV 3, Stockfish gives 3 lines. Each `info` line with a score has `multipv N` and `pv <move> ...`. `analyse` keeps the last of these lines for each `N`. The `line` of the candidate of `N` is all the moves after ` pv ` in that line. Its `move` is the first of them, and its score is the score of that line. The candidates are in the order of `N`.

`score` takes the `score` and the `line` from the last `info` line with a score before `bestmove`. If that line has no ` pv `, `line` is `[move]`. With `searchmoves` and one move, Stockfish gives only 1 line, also with MultiPV 3. A line without ` score ` does not change the candidate.

| Score | Value |
|---|---|
| `score cp <n>` | `n` |
| `score mate <n>`, `n` more than 0 | `10000` |
| `score mate <n>`, `n` 0 or less | `-10000` |

The side to move is always your side, so the scores are from your side.

## One request at a time
The engine does one request at a time. A call of `analyse` or `score` starts only when the call before it is complete. The engine keeps a promise queue for this. A call that fails does not stop the next calls. The engine does not remove old requests from the queue.

Each analysis at depth 16 with 3 lines takes approximately 0.6 s. If you drop many moves quickly in a variation, the analyses wait in the queue. A request of the line that comes after them also waits.

## Errors
After an `error` event of the worker, the current call and each later call throws `Error("The engine did not start. Reload the page.")`. The engine does not try again.

## Setup
- The `stockfish` package is GPL-3.0 licensed.
- `npm install` runs `scripts/copy-stockfish.js` (the `postinstall` script). It copies `stockfish-19-lite-single.js` and `stockfish-19-lite-single.wasm` from `node_modules/stockfish/bin/` to `public/stockfish/`. Git ignores `public/stockfish`.

## Notes
- `analyse` and `score` do not run at the same time, because of the queue. The trainer and the explorations of the screen can call the engine at any time.
- `score` must run after `analyse` of the same position. The trainer does this.
- The code uses `async` and `await` inside, because it wraps the worker.
