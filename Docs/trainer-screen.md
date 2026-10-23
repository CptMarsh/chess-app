---
type: component
title: Trainer screen
description: The screen of the opening trainer. It shows the rating field, the board, the moves, the message and the status.
resource: src/ui/trainerView.ts
tags: [ui, screen, chessground]
---

# Trainer screen

The screen shows the opening trainer in the browser. It holds no chess rules. It gets all its data from the `CurrentLine` query. `src/ui/` does not use `async` or `await`.

`mountTrainer(root, bus, trainer)` adds the parts of the screen to `root`. It gives the `show` function. The trainer calls `show()` after each command.

```
Rating [ 1450 ]  [ New line ]
+-------------+
|             |
|    board    |
|  (White)    |
|             |
+-------------+
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6
Bc4 loses 0.8 pawns. The best move is Bb5.
Status: your move
```

## Parts

| Part | Content |
|---|---|
| `Rating` field | The rating that you type before each line. |
| **New line** button | Starts a new line with the rating. |
| `#board` | The board (`chessground`), 400 × 400 pixels, from the White side. |
| `#moves` | The moves with move numbers, for example `1. e4 e5 2. Nf3`. |
| `#message` | The message of the line, or the rating error. |
| `#status` | `Status: ` and the status text. |

## The show function

`show()` asks `CurrentLine`. Then it draws all parts again:

- The board gets the FEN and the side to move (field 2 of the FEN).
- You can move a White piece only when the status is `yourMove`. The board lets you drop a piece only on a legal square from `legalMoves`.
- If the line has an arrow, the board shows it in green. If not, the board shows no arrow.
- The board marks no last move. `CurrentLine` does not hold the last move, and chessground would mark an old move.
- The **New line** button is disabled while the status is `checkingYourMove` or `waitingForReply`. Thus a late answer cannot go into a different line.

| Status | Status text |
|---|---|
| `yourMove` | `your move` |
| `checkingYourMove` | `checking your move` |
| `waitingForReply` | `waiting for the reply` |
| `ended` | `line ended` |

## Your move

When you drop a piece, the screen sends the move in UCI to `trainer.yourMove`, for example `e2e4`. A pawn on rank 8 always becomes a queen. For this pawn, the screen adds `q`, for example `b7a8q`.

## New line

**New line** reads the rating field with `readRating`. An empty field gives `NaN`. Then it calls `trainer.start(rating)`. If `start` throws an error, `#message` shows the error message, for example `The rating must be a whole number, 0 or more.`

## Text functions (`src/ui/text.ts`)

| Function | Result |
|---|---|
| `readRating(text)` | The number in the text. An empty text, or a text with only spaces, gives `NaN`. |
| `moveList(moves)` | The moves with move numbers. `["e4", "e5", "Nf3"]` gives `1. e4 e5 2. Nf3`. |
| `statusText(status)` | The status text from the table above. |

## Start of the app (`src/main.ts`)

`src/main.ts` connects the units:

1. It makes the `LineBus` and calls `attachLine`.
2. It makes a `StockfishEngine` with `new Worker("/stockfish/stockfish-19-lite-single.js")`.
3. It makes a `LichessExplorer` with `VITE_LICHESS_TOKEN`. If the token is not set, the token is empty.
4. It makes the `Trainer` with a `show` function that calls the `show` function of the screen.
5. It calls `mountTrainer`, then `show()`.

## Setup

1. Put your Lichess token in `.env.local`. See [Lichess explorer](lichess-explorer.md).
2. Run `npm run dev`.

`chessground` 9.2.1 is GPL-3.0-or-later licensed. The screen uses its 3 style sheets: `chessground.base.css`, `chessground.brown.css` and `chessground.cburnett.css`.

## Tests

- `src/ui/text.spec.ts` (Vitest) tests the text functions.
- `e2e/features/opening-trainer.feature` (Cucumber.js and Playwright) has 4 scenarios. Playwright gives fixed explorer answers. The test server sets `VITE_LICHESS_TOKEN` to `e2e-token`. Thus the tests need no real token and no network. The real Stockfish runs in the browser.
- The explorer answer in the e2e tests is one row of the table in the feature. The row is the full move number of the FEN (field 6), counted from 1.
- `AppWorld.play(move)` waits for `Status: your move`. Then it clicks the 2 squares, and waits until the move list changes. Thus the next move does not start before the screen shows the move.
