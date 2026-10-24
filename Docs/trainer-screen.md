---
type: component
title: Trainer screen
description: The screen of the opening trainer. It shows the rating field, the color field, the moves field, the board, the eval bar, the moves, the message, the eval, the accuracy and the status.
resource: src/ui/trainerView.ts
tags: [ui, screen, chessground]
---

# Trainer screen

The screen shows the opening trainer in the browser. It holds no chess rules. It gets all its data from the `CurrentLine` query. `src/ui/` does not use `async` or `await`.

`mountTrainer(root, bus, trainer)` adds the parts of the screen to `root`. It gives the `show` function. The trainer calls `show()` after each command.

```
Rating [ 1450 ]  Color [ White v ]  Moves [ 10 ]  [ New line ]
+--+-------------+
|  |             |
|▓▓|    board    |
|▓▓|  (White)    |
|  |             |
+--+-------------+
1. e4 e5 (42%) 2. Nf3 Nc6 (61%) 3. Bb5 a6 (55%)
Bc4 loses 0.8 pawns. The best move is Bb5.
Eval: +0.3
Accuracy: 7 of 9 correct (78%)
Status: your move
```

## Parts

| Part | Content |
|---|---|
| `Rating` field | The rating that you type before each line. |
| `Color` field | A select with `White` and `Black`. White is the default. |
| `Moves` field | The number of your moves in the line. The start value is `10`. |
| **New line** button | Starts a new line with the rating, the color and the number of moves. |
| `#board` | The board (`chessground`), 400 × 400 pixels. The side of the board is the color of the line. |
| `#evalBar` | A vertical bar on the left of the board, in the same row. It is 16 pixels wide and 400 pixels high, and it is dark. It holds `#evalBarWhite`. It has `flex-direction: column-reverse`, so the light part starts at the bottom. It has the class `black` when the color is Black. Then the direction is `column`, so the light part starts at the top. |
| `#evalBarWhite` | The light part of the bar. Its height is `barHeight` %. |
| `#moves` | The moves with move numbers and the % of each opponent move, for example `1. e4 e5 (42%) 2. Nf3`. |
| `#message` | The message of the line, or the rating error. |
| `#eval` | `Eval: ` and `evalText(eval)`. It comes after `#message`. |
| `#accuracy` | `Accuracy: ` and `accuracyText(accuracy)`. It comes after `#eval`. |
| `#status` | `Status: ` and the status text. |

## The show function

`show()` asks `CurrentLine`. Then it draws all parts again:

- The board gets the FEN, the side to move (field 2 of the FEN) and the orientation (the color of the line).
- You can move a piece of your color only when the status is `yourMove`. The board lets you drop a piece only on a legal square from `legalMoves`.
- If the line has an arrow, the board shows it in green. If not, the board shows no arrow.
- The board marks no last move. `CurrentLine` does not hold the last move, and chessground would mark an old move.
- The screen keeps `barHeight`. It starts at 50. Each `show()` sets `barHeight = evalBarHeight(eval, moves.length, barHeight)`. Then it sets the height of `#evalBarWhite` to `barHeight` %.
- Eval bar rule: when the eval is not `null`, the bar shows it. When the eval is `null` and the move list is empty, the bar is at 50. When the eval is `null` and the move list is not empty, the bar keeps its last height.
- The **New line** button is enabled only when the status is `yourMove` or `ended`. Thus a late answer cannot go into a different line.

| Status | Status text |
|---|---|
| `yourMove` | `your move` |
| `checkingPosition` | `checking the position` |
| `checkingYourMove` | `checking your move` |
| `waitingForReply` | `waiting for the reply` |
| `ended` | `line ended` |

## Your move

When you drop a piece, the screen sends the move in UCI to `trainer.yourMove`, for example `e2e4`. A pawn on rank 8 or rank 1 always becomes a queen. For this pawn, the screen adds `q`, for example `b7a8q`.

## New line

**New line** reads the rating field and the `Moves` field with `readNumber`. An empty field gives `NaN`. It reads the color from the `Color` field. Then it calls `trainer.start(rating, color, moves)`. If the promise of `start` rejects, `#message` shows the error message, for example `The rating must be a whole number, 0 or more.` or `The number of moves must be a whole number, 2 or more.`

## Text functions (`src/ui/text.ts`)

| Function | Result |
|---|---|
| `readNumber(text)` | The number in the text. An empty text, or a text with only spaces, gives `NaN`. |
| `moveList(moves)` | The moves (`{ san, percent }` objects) with move numbers. A move with a `percent` that is not `null` gets ` (42%)` after it. `[e4 null, e5 42, Nf3 null]` gives `1. e4 e5 (42%) 2. Nf3`. |
| `statusText(status)` | The status text from the table above. |
| `evalText(centipawns)` | `null` gives `–`. Exactly `10000` gives `mate for White`. Exactly `-10000` gives `mate for Black`. Other values: the pawns, rounded to one decimal, and a `+` before a positive value. For example `30` gives `+0.3` and `-120` gives `-1.2`. A value that rounds to 0 gives `0.0`. |
| `accuracyText(accuracy)` | `checked` 0 gives `–`. Other values give `correct of checked correct (percent%)`, with the percent rounded to a whole number. For example `{ 7, 9 }` gives `7 of 9 correct (78%)`. |
| `evalBarPercent(centipawns)` | `50 + 50 × (2 ÷ (1 + e^(−0.00368208 × centipawns)) − 1)`. `10000` gives 100. `-10000` gives 0. `0` gives 50. |
| `evalBarHeight(centipawns, moveCount, last)` | A value that is not `null` gives `evalBarPercent(centipawns)`. `null` with `moveCount` 0 gives 50. `null` with more moves gives `last`. |

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
- `e2e/features/opening-trainer.feature` (Cucumber.js and Playwright) has 6 scenarios, one of them for Black and one for the number of moves. Only the scenario of 5 moves and the scenario of 3 moves change the `Moves` field. The other scenarios keep the start value of 10. The Background has the explorer table and opens the app. Each scenario starts the line. The step of an explorer table first removes the earlier explorer route, so the table of a scenario replaces the table of the Background. Playwright gives fixed explorer answers. The test server sets `VITE_LICHESS_TOKEN` to `e2e-token`. Thus the tests need no real token and no network. The real Stockfish runs in the browser.
- The explorer answer in the e2e tests is one row of the table in the feature. The row is the full move number of the FEN (field 6), counted from 1. The third column of the row is the % of the move. The answer has the position total 100, so the screen shows this %.
- `AppWorld.play(move)` waits for `Status: your move`. Then it clicks the 2 squares (for the Black side of the board, the click position is turned around), and waits until the move list changes. Thus the next move does not start before the screen shows the move.
