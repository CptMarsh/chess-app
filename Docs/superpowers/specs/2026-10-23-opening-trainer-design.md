---
type: spec
title: Opening trainer
description: The design of the opening trainer. You play White, the app replies with common moves of your rating band, and the engine checks your moves.
tags: [spec, opening, trainer]
---

# Opening trainer

## Goal
The opening trainer helps you build your opening repertoire as White.

You play a first move. The app replies with a move that players in your rating band often play. Then you must find a move that is almost as good as the engine's best move. This continues until you played 5 moves.

A line is a success when you know a line of 5 moves. In it, your moves 2 to 5 are almost as good as the engine's best moves, against the moves that real players at your level play.

## Decisions
| Subject | Decision |
|---|---|
| Your color | White. |
| Your first move | Any legal move. The app does not check it. |
| Correct move | A move that loses 20 centipawns or less against the engine's best move. |
| Bad move | The app shows the best move, plays it instead of your move, and continues. |
| Reply of the app | A random move from the 5 most common moves in your rating band. A move with more games has a higher chance. |
| Length | 5 of your moves. A move that the app replaces is one of these 5 moves. |
| After a line | The app keeps no data. |
| Rating | You type it before each line. The page keeps it only while it is open. |
| Moves of real players | Lichess opening explorer, Lichess games, speeds blitz, rapid and classical. |
| Engine | Stockfish 19 lite, one thread, in a Web Worker, depth 16. |
| Chess rules | `chess.js` (BSD-2-Clause). |
| Board | `chessground` (GPL-3.0-or-later). |

## Facts that we checked (2026-10-23)
- The explorer (`https://explorer.lichess.ovh/lichess`) refuses a request without a token: `401 Authorization Required`.
- The explorer CORS preflight allows any origin and the `Authorization` header. Thus the browser can send the token.
- The `stockfish` npm package 19.0.1 has `bin/stockfish-19-lite-single.js` (28 KB) and `bin/stockfish-19-lite-single.wasm` (1.9 MB). Its licence is GPL-3.0.
- The explorer gives castling as king to rook, for example `e8h8` for Black short castling. `chess.js` refuses `e8h8` and accepts `e8g8`.

## Architecture
The bus is synchronous, and handlers must not call `send`. The explorer and the engine are asynchronous. Thus one async unit, the trainer, waits for them and then sends a command that contains the result. All rules are in synchronous handlers.

We do not change the bus to give a `Promise`. That change would break a contract that has tests, and it would put I/O into the handlers.

| Unit | Purpose | Depends on |
|---|---|---|
| `src/line/` | Commands, queries and handlers for one line. It holds all the rules of the line. | bus, `chess.js` |
| `src/explorer/` | Gives the 5 most common replies for a position and a rating. | `fetch`, token |
| `src/engine/` | Gives the best move, its score and the score of your move. | Stockfish worker |
| `src/trainer/` | Does the async steps in the correct order. It holds no rules. | bus, explorer, engine |
| `src/ui/` | Shows the board, the rating field, the move list, the message and the status. | `chessground`, bus, trainer |
| `src/main.ts` | Connects the units. | all units |

### Line (`src/line/`)
All handlers get the same `Line` object in their constructors. The `Line` object holds the state of the current line.

| Command | Result |
|---|---|
| `StartLine(rating)` | Starts a new line at the start position. Status: your move. It throws `The rating must be a whole number, 0 or more.` if the rating is not a whole number of 0 or more. |
| `PlayYourMove(move)` | Plays your move (UCI, for example `e2e4`). Status: checking your move. For your first move, the status is waiting for the reply. |
| `JudgeYourMove(verdict)` | Accepts your move, or replaces it with the best move. It sets the message. Status: waiting for the reply, or line ended. |
| `PlayReply(replies)` | Picks one reply and plays it. Status: your move. If `replies` is empty, the line ends. |
| `StopLine(message)` | Ends the line with the message. |

| Query | Answer |
|---|---|
| `CurrentLine` | The FEN, the moves in SAN, the status, the message, the arrow of the best move (or none), and the legal moves for each square when the status is your move. |

The status values are `yourMove`, `checkingYourMove`, `waitingForReply` and `ended`.

A verdict has `bestMove` (UCI), `bestScore` and `yourScore`. The scores are in centipawns from the White side. A mate for White is +10000. A mate for Black is -10000. The loss is `bestScore - yourScore`.

`JudgeYourMove` sets one of these messages:

| Condition | Message | Board |
|---|---|---|
| Your move is `bestMove`. | `Best move.` | Your move stays. |
| The loss is 20 or less. | `Good. The best move was Nf3.` | Your move stays. |
| The loss is more than 20, and `yourScore` is -10000. | `g4 allows mate. The best move is e4.` | The best move replaces your move. An arrow shows it. |
| The loss is more than 20, and `bestScore` is +10000. | `Bc4 misses a mate. The best move is Qxf7#.` | The best move replaces your move. An arrow shows it. |
| The loss is more than 20 in all other conditions. | `Bc4 loses 0.8 pawns. The best move is Nf3.` | The best move replaces your move. An arrow shows it. |

The pawn value is the loss divided by 100, with one decimal.

The line ends after `JudgeYourMove` for your fifth move. If the move on the board after `JudgeYourMove` gives checkmate, the line also ends, and the message gets ` Checkmate.` at its end.

`PlayReply` picks the reply with an injected random function (default `Math.random`). It multiplies the random number by the total of the game counts. It picks the first reply where the running total of the game counts is more than that product. If `replies` is empty, the line ends with `No games at your level after this position.`

### Explorer (`src/explorer/`)
`replies(fen, rating)` sends a GET request to:

```
https://explorer.lichess.ovh/lichess?variant=standard&speeds=blitz,rapid,classical&ratings=<band>&fen=<fen>&moves=5&topGames=0&recentGames=0
```

The request has the header `Authorization: Bearer <token>`. The token comes from `import.meta.env.VITE_LICHESS_TOKEN`.

The band is the highest of 0, 1000, 1200, 1400, 1600, 1800, 2000, 2200 and 2500 that is not more than the rating. For example, 1450 gives 1400, 800 gives 0, and 2600 gives 2500.

Each reply has `uci`, `san` and `games`. `games` is `white + draws + black` from the explorer answer.

The explorer changes a castling `uci` to the standard form, for example `e8h8` to `e8g8` and `e8a8` to `e8c8`. It looks at `san`: only a `san` that starts with `O-O` is castling.

### Engine (`src/engine/`)
When the worker starts, the engine sends `uci` and waits for `uciok`.

`judge(fen, move)` uses the UCI protocol with the worker:

1. `ucinewgame`, `isready` and wait for `readyok`, `position fen <fen>`, `go depth 16`. It keeps the last `score` before `bestmove`. This gives `bestMove` and `bestScore`.
2. If `move` is not `bestMove`: `position fen <fen>`, `go depth 16 searchmoves <move>`. This gives `yourScore`. Otherwise `yourScore` is `bestScore`.

`score cp <n>` gives `n`. `score mate <n>` gives +10000 if `n` is more than 0, and -10000 if not. White is always the side to move, so the scores are from the White side.

The worker is `stockfish-19-lite-single.js` from the `stockfish` package.

### Trainer (`src/trainer/`)
`start(rating)` sends `StartLine(rating)`.

`yourMove(move)` does these steps. After each command, it calls the `show` function that it got in its constructor.

1. Ask `CurrentLine` for the FEN before your move.
2. Send `PlayYourMove(move)`.
3. If this was not your first move: get the verdict from the engine, then send `JudgeYourMove(verdict)`.
4. If the status is not `ended`: get the replies from the explorer, then send `PlayReply(replies)`.

If the engine or the explorer throws, the trainer sends `StopLine(error.message)` and stops.

### UI (`src/ui/`)
```
Rating [ 1450 ]  [ New line ]
+-------------+  1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
|             |
|    board    |  Bc4 loses 0.8 pawns.
|  (White)    |  The best move is Bb5.
|             |
+-------------+  Status: your move
```

- The board shows the position from the White side.
- You can move a piece only when the status is `yourMove`. The board lets you drop a piece only on a legal square from `CurrentLine`.
- A pawn that you move to the last rank always becomes a queen. For example, the UI sends `b7a8q`.
- The **New line** button is disabled while the status is `checkingYourMove` or `waitingForReply`. Thus a late answer cannot go into a different line.
- The `show` function asks `CurrentLine` and draws all parts again.

## Errors
When the explorer or the engine fails, the line ends with a message. The app does not try again.

| Problem | Message |
|---|---|
| `VITE_LICHESS_TOKEN` is empty. | `Add your Lichess token to .env.local as VITE_LICHESS_TOKEN, then start the app again.` |
| Lichess gives 401. | `Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token.` |
| Lichess gives 429. | `Lichess got too many requests. Wait one minute, then start a new line.` |
| Lichess gives a different status. | `Lichess did not answer (status 503).` |
| The network fails. | `Lichess did not answer (network error).` |
| The Stockfish worker does not load, or it stops. | `The engine did not start. Reload the page.` |
| The rating is not a whole number of 0 or more. | `The rating must be a whole number, 0 or more.` The line does not start. |

## Setup
1. Make a Lichess personal token at `https://lichess.org/account/oauth/token`. It needs no scopes.
2. Put `VITE_LICHESS_TOKEN=<token>` in `.env.local`. Git ignores `*.local` files.
3. Do not publish the built app. Vite puts the token into the browser code.

## Tests
Each spec file has a `*.steps.ts` file with `given…`, `when…` and `then…` functions, as in `src/bus/`. We write each case red, then green, then refactor.

### Unit specs (Vitest)
| Spec | Fakes | Cases |
|---|---|---|
| `src/line/line.spec.ts` (through the bus) | random function | A new line starts at the start position with the status `yourMove`. A bad rating is rejected. The first move goes to `waitingForReply` without a judgement. Each row of the message table. The line ends after your fifth move. A checkmate ends the line. Weighted pick: game counts 30 and 10, random 0.74 gives the first reply, and random 0.76 gives the second reply. No replies ends the line. `StopLine` ends the line with its message. |
| `src/explorer/explorer.spec.ts` | `fetch` | The URL has the FEN, the band, the speeds and `moves=5`. The request has the `Authorization` header. The 3 band examples. The answer becomes replies with game counts. Each explorer row of the error table. |
| `src/engine/engine.spec.ts` | worker | It reads `score cp` and `bestmove`. It uses `searchmoves` only when your move is not the best move. Mate scores become +10000 or -10000. A worker error gives the engine message. |
| `src/trainer/trainer.spec.ts` | engine, explorer | The order of the steps. The status during each wait. No judgement for the first move. No reply after the line ends. An engine or explorer error sends `StopLine`. |

### E2E (Cucumber and Playwright)
`e2e/features/opening-trainer.feature`:
- Playwright `page.route` gives fixed explorer answers. Thus the tests need no real token and no network. The test server sets a dummy `VITE_LICHESS_TOKEN`.
- The real Stockfish runs in the browser. One thread at a fixed depth gives the same result each time. The scenarios use only clear moves, for example a move that loses a piece.

Scenarios:
1. The app replies to your first move.
2. The app replaces a bad move with the best move.
3. The line ends after 5 of your moves.
4. Lichess does not accept the token.

## Documentation
Each unit gets an OKF page in `Docs/`. `Docs/index.md` links to each page.

## Not included
- Black as your color.
- Saved lines, a repertoire list and drills.
- A choice of line length.
- Timeouts, automatic retry and a cache of explorer answers.
- Lichess cloud evaluation.
- A choice of promotion piece. A promotion is possible on your fifth move, but it is rare.
