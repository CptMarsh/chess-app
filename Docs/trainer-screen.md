---
type: component
title: Trainer screen
description: The screen of the opening trainer. It shows the rating field, the color field, the moves field, the board, the eval bar with the eval number, the move list, the message, the accuracy and the status.
resource: src/ui/trainerView.ts
tags: [ui, screen, chessground]
---

# Trainer screen

The screen shows the opening trainer in the browser. It holds no chess rules. It gets all its data from the `CurrentLine` query. `src/ui/` does not use `async` or `await`.

`mountTrainer(root, bus, trainer)` adds the parts of the screen to `root`. It gives the `show` function. The trainer calls `show()` after each command.

```
+----+------------------+  +---------------------------------+
|    |                  |  | Rating [1450] Color [White v]   |
|░░░░|                  |  | Moves [10]          [ New line ]|
|▓▓▓▓|      board       |  +---------------------------------+
|▓▓▓▓|                  |  | 1.  e4         e5   42%         |
|▓▓▓▓|                  |  | 2.  Nf3       [Nc6] 61%         |
|0.3 |                  |  |                                 |
+----+------------------+  +---------------------------------+
                           | Bc4 loses 0.8 pawns.            |
                           | Play Bb5 or d4.                 |
                           | Accuracy: 7 of 9 correct (78%)  |
                           | Status: try again               |
                           +---------------------------------+
```

## Parts

| Part | Content |
|---|---|
| `#boardRow` | The eval bar and the board, side by side. |
| `#panel` | The side panel, on the right of `#boardRow`. It is 320 pixels wide and has the height of the board (400 pixels). It holds `#settings`, `#moveList`, `#message`, `#accuracy` and `#status`. |
| `#settings` | The `Rating`, `Color` and `Moves` fields and the **New line** button. |
| `Rating` field | The rating that you type before each line. |
| `Color` field | A select with `White` and `Black`. White is the default. |
| `Moves` field | The number of your moves in the line. The start value is `10`. |
| **New line** button | Starts a new line with the rating, the color and the number of moves. |
| `#board` | The board (`chessground`), 400 × 400 pixels. The side of the board is the color of the line. |
| `#evalBar` | A vertical bar on the left of the board, in the same row. It is 24 pixels wide and 400 pixels high, and it is dark. It holds `#evalBarWhite`. It has `flex-direction: column-reverse`, so the light part starts at the bottom. It has the class `black` when the color is Black. Then the direction is `column`, so the light part starts at the top. |
| `#evalBarWhite` | The light part of the bar. Its height is 50 % when `shownEval` is `null`, and `evalBarPercent(shownEval)` % in all other conditions. |
| `#evalBarText` | The eval number on the bar: `barText(shownEval)`, 10 pixels, bold. It has the class `whiteEnd` when `shownEval` is `null` or 0 or more, and `blackEnd` when it is less than 0. `whiteEnd` is at the White end of the bar, in dark text (`#333`). `blackEnd` is at the Black end, in light text (`#eee`). The White end is at the bottom for White, and at the top for Black (`#evalBar.black`). |
| `#moveList` | One row (`.row`) for each move number, from `moveRows(moves)`. A row has the number (`.number`, for example `1.`), the White move and the Black move. Each move is a `.move` with `data-index` (the index in `moves`, from 0). It holds the SAN (`.san`) and the % (`.percent`, for example `42%`, or empty for your moves) in small grey text (`#989795`). The viewed move has the class `viewed` and the background `#484644`. At the current position, this is the last move. At the start position, no move has the class. The row of the viewed move scrolls into view. The list fills the free height of the panel and scrolls. |
| `#message` | The message of the line, or the rating error. |
| `#accuracy` | `Accuracy: ` and `accuracyText(accuracy)`. It comes after `#message`. |
| `#status` | `Status: ` and the status text. |

## Dark mode

The screen is always dark. There is no switch. `trainer.css` sets `color-scheme: dark` on `html`, so the fields and the select are also dark.

| Part | Color |
|---|---|
| Page (`body`) | `#302E2B` |
| `#panel` | `#262522` |
| Text | `#FFFFFF` |
| Grey text (the %) | `#989795` |
| Highlight of the viewed move | `#484644` |
| **New line** | `#81B64C`, with white bold text. When it is disabled, its opacity is 0.5. |

The board (`chessground.brown.css`) and the eval bar keep their colors. In `#settings`, the fields are 56 pixels wide, so the 3 fields and **New line** fit on 2 lines.

## The show function

`show()` asks `CurrentLine`. Then it draws all parts again:

- The board gets the FEN of the viewed position, the side to move (field 2 of the FEN) and the orientation (the color of the line). See "Navigation".
- You can move a piece of your color only when the status is `yourMove` or `tryAgain`. The board lets you drop a piece only on a legal square from `legalMoves`. In `tryAgain`, these are only the acceptable moves.
- The board shows each arrow of the line in green. After a mistake, there is one arrow for each acceptable move.
- The board marks no last move. `CurrentLine` does not hold the last move, and chessground would mark an old move.
- Each `show()` sets `shownEval`, the eval that the bar shows, to `barEval(evals, position)`. `evals` is `startEval` and then the `eval` of each move. `position` is `viewed`, or the number of moves at the current position. Then it sets the height of `#evalBarWhite` and the text of `#evalBarText`.
- Eval bar rule: the bar shows the eval of the position on the board. When that eval is `null`, the bar shows the eval of the nearest earlier position that has an eval. When no earlier position has an eval, the bar is at 50 and has no number. For example, while the engine checks your move, the bar shows the eval of the position before your move. At the position after your first move, the bar shows the eval of the position before it, because the line does not judge your first move. For Black, the start position has no eval, so the bar is at 50 there.
- The **New line** button is enabled only when the status is `yourMove`, `tryAgain` or `ended`. In these statuses, no answer is pending. Thus a late answer cannot go into a different line.

| Status | Status text |
|---|---|
| `yourMove` | `your move` |
| `tryAgain` | `try again` |
| `checkingPosition` | `checking the position` |
| `checkingYourMove` | `checking your move` |
| `waitingForReply` | `waiting for the reply` |
| `ended` | `line ended` |

## Navigation

The screen keeps `viewed`: the number of moves of the viewed position, or `null` for the current position. It also keeps `shownCount`: the number of moves at the last `show()`.

| Key | Result |
|---|---|
| ← (`ArrowLeft`) | One move back. It does not go below the start position. |
| → (`ArrowRight`) | One move forward. |
| ↑ (`ArrowUp`) | The start position. |
| ↓ (`ArrowDown`) | The current position. |

- A click on a move shows the position after that move.
- The position of `viewed` 0 is the start position (`fen: "start"` in chessground). The position of `viewed` `n` is the `fen` of move `n`.
- At an old position, the board is locked and has no arrows. The highlight (`viewed`) is on the viewed move. The eval bar shows the eval of the viewed position (see the eval bar rule). The message, the accuracy and the status always show the current position. **New line** keeps its rule.
- When the number of moves changes, `viewed` goes back to `null`. Thus a reply or a take back shows the current position.
- When the focus is in an `input` or a `select`, the keys do not navigate. For the 4 arrow keys, the screen stops the default action. Thus ↑ and ↓ do not scroll the page.

### Navigation functions (`src/ui/navigation.ts`)

| Function | Result |
|---|---|
| `viewOf(moves, moveCount)` | `null` when `moves` is `moveCount` or more. In all other conditions, `moves`. A click on the move with index `i` gives `viewOf(i + 1, moveCount)`. |
| `nextView(key, viewed, moveCount)` | The next `viewed` for a key, from the table above. Each result goes through `viewOf`. From `null`, ← gives `moveCount - 1`, and → gives `null`. Other keys give no change. |
| `keptView(viewed, shownCount, moveCount)` | `viewed` when `shownCount` is `moveCount`. In all other conditions, `null`. |

## Your move

When you drop a piece, the screen sends the move in UCI to `trainer.yourMove`, for example `e2e4`. A pawn on rank 8 or rank 1 always becomes a queen. For this pawn, the screen adds `q`, for example `b7a8q`.

## New line

**New line** reads the rating field and the `Moves` field with `readNumber`. An empty field gives `NaN`. It reads the color from the `Color` field. Then it calls `trainer.start(rating, color, moves)`. If the promise of `start` rejects, `#message` shows the error message, for example `The rating must be a whole number, 0 or more.` or `The number of moves must be a whole number, 2 or more.`

## Text functions (`src/ui/text.ts`)

| Function | Result |
|---|---|
| `readNumber(text)` | The number in the text. An empty text, or a text with only spaces, gives `NaN`. |
| `moveRows(moves)` | One `{ number, white, black }` for each move number. `white` and `black` are `{ index, san, percent }`. `index` is the index in `moves`, from 0. `black` is `null` when the row has only the White move. `[e4 null, e5 42, Nf3 null]` gives 2 rows: `1` with `e4` and `e5`, and `2` with `Nf3` and `null`. |
| `statusText(status)` | The status text from the table above. |
| `barText(centipawns)` | `null` gives an empty text. `10000` and `-10000` give `M`. Other values give the pawns, rounded to one decimal, with no sign, as on chess.com. For example `30` gives `0.3`, `-120` gives `1.2`, and `-4` gives `0.0`. |
| `accuracyText(accuracy)` | `checked` 0 gives `–`. Other values give `correct of checked correct (percent%)`, with the percent rounded to a whole number. For example `{ 7, 9 }` gives `7 of 9 correct (78%)`. |
| `evalBarPercent(centipawns)` | `50 + 50 × (2 ÷ (1 + e^(−0.00368208 × centipawns)) − 1)`. `10000` gives 100. `-10000` gives 0. `0` gives 50. |
| `barEval(evals, position)` | The last value that is not `null` in `evals`, from index 0 to index `position`. If all are `null`, it gives `null`. For example, `[30, null, 50]` with `position` 1 gives 30. |

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

- `src/ui/text.spec.ts` (Vitest) tests the text functions. `src/ui/navigation.spec.ts` tests the navigation functions.
- `e2e/features/opening-trainer.feature` (Cucumber.js and Playwright) has 7 scenarios. The first scenario also checks that the page background is `rgb(48, 46, 43)`. One scenario is for Black, one for the number of moves, one for a mistake and one for the navigation. The scenario of a mistake checks the fixed message `Ba6 loses 6.4 pawns. Play Nf3, Nc3 or Bc4.` The real Stockfish gives the same scores each time, so this message does not change. Only the scenario of 5 moves and the scenario of 3 moves change the `Moves` field. The other scenarios keep the start value of 10. The Background has the explorer table and opens the app. Each scenario starts the line. The step of an explorer table first removes the earlier explorer route, so the table of a scenario replaces the table of the Background. Playwright gives fixed explorer answers. The test server sets `VITE_LICHESS_TOKEN` to `e2e-token`. Thus the tests need no real token and no network. The real Stockfish runs in the browser.
- The step `the moves are` waits until the text that `AppWorld.waitForMoves` makes from `#moveList` is the text of the step. For each row, it takes the number, then the SAN of each move, with ` (42%)` after a move with a %. Thus the texts in the feature stay `1. e4 e5 (42%) 2. Nf3`.
- The navigation scenario uses the steps `the player presses {string}`, `the player presses {string} in the {string} field`, `the player clicks the move {string}`, `the highlighted move is {string}` and `the board has a {string} on {string}`. `AppWorld.waitForPiece(piece, square)` waits until a `cg-board piece` with the classes of the piece (for example `black knight`) has a `translate` on that square. The square math is the inverse of the clicks of `AppWorld.play`.
- The explorer answer in the e2e tests is one row of the table in the feature. The row is the full move number of the FEN (field 6), counted from 1. The third column of the row is the % of the move. The answer has the position total 100, so the screen shows this %.
- `AppWorld.play(move)` waits for `Status: your move` or `Status: try again`. It keeps the move list and the status. Then it clicks the 2 squares (for the Black side of the board, the click position is turned around), and waits until the text of `#moveList` or the status changes. Thus the next move does not start before the screen shows the move. (After a mistake, the move list can stay the same, but the status changes.)
