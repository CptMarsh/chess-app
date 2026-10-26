---
type: component
title: Trainer screen
description: The screen of the opening trainer. It shows New line and the cog with the rating, color, moves, source and username fields, the board, the eval bar with the eval number, the move list with its variations, the navigation buttons, the engine lines in explore mode, the message, the accuracy, the status, and the Copy PGN and Change token buttons.
resource: src/ui/trainerView.ts
tags: [ui, screen, chessground, variations, popover, mobile, responsive, engine, pgn, clipboard]
---

# Trainer screen

The screen shows the opening trainer in the browser. It holds no chess rules. It gets all its data from the `CurrentLine` and `ExploreMoves` queries. `src/ui/` does not use `async` or `await`.

`mountTrainer(root, bus, trainer, changeToken, settings)` adds the parts of the screen to `root`. It gives the `show` function. The trainer calls `show()` after each command.

```
+----+------------------+  +---------------------------------+
|    |                  |  | [ New line ]                [⚙] |
|░░░░|                  |  |               +----------------+|
|▓▓▓▓|      board       |  |               | Rating  [1450] ||
|▓▓▓▓|                  |  |               | Color [White v]||
|▓▓▓▓|                  |  |               | Moves     [10] ||
|▓▓▓▓|                  |  |               | Source[Lich v] ||
|0.3 |                  |  |               +----------------+|
+----+------------------+  | 1.  e4         e5   42%         |
                           | 2.  Nf3       [Nc6] 61%         |
                           |   (2. Ba6 Nxa6 3. Nf3 d5)       |
                           | [ ⏮ ] [ ◀ ] [ ▶ ] [ ⏭ ]         |
                           | +0.3 2. Nf3 Nc6 3. Bb5 a6 4. …  |
                           | +0.2 2. Bc4 Nf6 3. d3 Bc5 4. …  |
                           | +0.1 2. Nc3 Nf6 3. f4 d5 4. …   |
                           | Bc4 loses 0.8 pawns.            |
                           | Play Bb5 or d4.                 |
                           | Accuracy: 7 of 9 correct (78%)  |
                           | Status: try again               |
                           | [Copy PGN] [Change token]       |
                           +---------------------------------+
```

## Parts

| Part | Content |
|---|---|
| `#boardRow` | The eval bar and the board, side by side. |
| `#panel` | The side panel, on the right of `#boardRow`. It is `--panel-width` wide (320 to 480 pixels) and has the height of the board. See "Big screen view". It holds `#top`, `#settings`, `#moveMenu`, `#moveList`, `#navigation`, `#engineLines`, `#message`, `#accuracy`, `#status` and `#bottom`. |
| `#top` | The top of the panel: **New line** (`#newLine`) on the left and the cog button (`#cog`) on the right. |
| `#cog` | The cog button: an inline SVG in `currentColor`, with `aria-label="Settings"` and `popovertarget="settings"`. A click on the cog opens or closes `#settings`. |
| `#settings` | A popover (the `popover` attribute) with the `Rating`, `Color`, `Moves`, `Source` and `Username` fields, each on its own line. A click outside the popover, or the Escape key, closes it. The browser does this. `mountTrainer` calls `showPopover()`, so the popover is open when the app starts. A click on **New line** is outside the popover, so it closes the popover. When it opens, the screen puts it under the cog, with its right side at the right side of the cog. |
| `#moveMenu` | The menu of a variation move: a popover with one button, **Delete from here**. See "Delete". |
| `Rating` field | The rating that you type before each line. |
| `Color` field (`#color`) | A select with `White` and `Black`. White is the default. |
| `Source` field (`#source`) | A select with `Lichess` (`lichess`) and `chess.com` (`chessCom`). It is the source of the replies and their %. It starts with `settings.source()`. A change calls `settings.save(source, username)`. See [Settings store](settings.md). |
| `Username` field (`#username`) | Your chess.com username. It starts with `settings.username()`. Each input calls `settings.save(source, username)`. Its label (`#usernameLabel`) is hidden when the source is Lichess. |
| `Moves` field | The number of your moves in the line. The start value is `10`. |
| **New line** button | Starts a new line with the rating, the color and the number of moves. |
| `#board` | The board (`chessground`), `--board-size` × `--board-size` (at least 400 × 400 pixels on the desktop, see "Big screen view" and "Mobile view"). The side of the board is the color of the line. |
| `#evalBar` | A vertical bar on the left of the board, in the same row. It is 24 pixels wide and has the height of the board. Its dark part is `surface-300`. It holds `#evalBarWhite`. It has `flex-direction: column-reverse`, so the light part starts at the bottom. It has the class `black` when the color is Black. Then the direction is `column`, so the light part starts at the top. |
| `#evalBarWhite` | The light part of the bar. Its height is 50 % when `shownEval` is `null`, and `evalBarPercent(shownEval)` % in all other conditions. |
| `#evalBarText` | The eval number on the bar: `barText(shownEval)`, 10 pixels, weight 600. It has the class `whiteEnd` when `shownEval` is `null` or 0 or more, and `blackEnd` when it is less than 0. `whiteEnd` is at the White end of the bar, in dark text (`surface-100`). `blackEnd` is at the Black end, in light text (`ink`). The White end is at the bottom for White, and at the top for Black (`#evalBar.black`). |
| `#moveList` | The items of `moveRows(nodes)`, in order: rows (`.row`) and variation lines (`.variations`). See "Move list". The list fills the free height of the panel and scrolls. |
| `#navigation` | 4 buttons under `#moveList`: **Start** (⏮), **Back** (◀), **Forward** (▶) and **End** (⏭). The name of each button is its `aria-label`. See "Navigation". |
| `#engineLines` | The engine lines of the position on the board, under `#navigation`. It shows only in explore mode. See "Engine lines". |
| `#message` | The message of the line, or the rating error. |
| `#accuracy` | `Accuracy: ` and `accuracyText(accuracy)`. It comes after `#message`. |
| `#status` | `Status: ` and the status text. |
| `#bottom` | The bottom of the panel: **Copy PGN** (`#copyPgn`) on the left of **Change token** (`#changeToken`). |
| **Copy PGN** (`#copyPgn`) | Puts `pgnText(nodes)` on the clipboard. See "Copy PGN". It is always enabled. |
| **Change token** (`#changeToken`) | Calls `changeToken()`, which opens the [token dialog](token.md). It is always enabled. |

## Darkwood style

The screen uses the Darkwood design system: https://claude.ai/artifact/Rz6E7erAxpLEZpXRGzKFzX. The app does not read the design system. `src/ui/darkwood.css` has a copy of the tokens that the app uses, as CSS variables on `:root`. `trainer.css` uses only these variables. When Darkwood changes, copy the new values into `darkwood.css`.

The screen is always dark. There is no switch. `trainer.css` sets `color-scheme: dark` on `html`.

| Part | Token |
|---|---|
| Page (`body`) | `surface-100` (`#16110d`) |
| `#panel` | `surface-200`, with the corners `radius-md` (6 pixels) |
| Text | `ink` |
| The % and the move numbers | `ink-muted` |
| Highlight of the viewed move | `amber`, with `on-accent` text |
| **New line** | `oak`, with `on-accent` text in weight 600 and the corners `radius-sm` (2 pixels). When it is disabled, its opacity is 0.5. |
| Fields, the select, the cog and the navigation buttons | `surface-300`, with `ink` text, a 1-pixel `line-strong` border and the corners `radius-sm` |
| **Copy PGN** and **Change token** | No background, `ink-muted` text, a 1-pixel `line-strong` border, the corners `radius-sm` and the padding `space-1` `space-2` |
| `#settings` and `#moveMenu` | `surface-300`, with a 1-pixel `line-strong` border, the corners `radius-md` and the padding `space-4` |
| `.variations` | `ink-muted`, with an indent of `space-4`. Its text wraps. |
| `#engineLines` | `space-2` above it. The eval (`.score`) is in the `label` style, 48 pixels wide. The moves (`.moves`) are `ink-muted`. Each line stays on one line and ends in `…` when it is too long. The texts `The engine is thinking.` and `No moves.` are `ink-muted`. |
| Focus | A 2-pixel `amber` outline, 2 pixels from the part (`:focus-visible`) |
| Eval bar | `ink` for the White part, `surface-300` for the Black part |

The text is in the `body` style: Karla, 15 pixels, line height 24 pixels. The move numbers are in the `label` style: JetBrains Mono, 12 pixels, weight 600, letter spacing 0.08em. The app does not use Fraunces, because the screen has no headings. The spaces are `space-1` (4 pixels), `space-2` (8 pixels) and `space-4` (16 pixels). These sizes do not change with the size of the screen.

The fonts come from the npm packages `@fontsource/karla` (weights 400 and 600) and `@fontsource/jetbrains-mono` (weight 600). Vite puts the font files in the build, so the app sends no font request to other sites, and the fonts also work offline.

The board (`chessground.brown.css`) keeps its colors. In `#settings`, the inputs are 56 pixels wide, and `#username` is 120 pixels wide.

## Move list

- The rows of the main line have the number (`.number`, for example `1.`, in the `label` style), the White move and the Black move. Each move is a `.move` with `data-id` (the id of its node). It holds the SAN (`.san`) and the % (`.percent`, for example `42%`, or empty for your moves) in small text (`ink-muted`).
- The variations of a node P are the children of P after the main child. They show in a `.variations` line after the row of the main child of P. If P has no main child (P is `current`), the line comes after the last row. If there are no rows, it is the first line.
- Each variation is in parentheses (`.paren`). A nested variation shows in the parentheses of its parent variation. It comes after the move that it is an alternative to, as in PGN: `(2. Bc4 Nf6 (2... Nc6 3. d3) 3. d3)`.
- Move numbers in a variation follow PGN. A White move always has its number (`3.`). A Black move has its number with `...` (`2...`) when it is the first move of a variation, or when it comes after a nested variation.
- Each variation move is a `.move` with `data-id`. It holds `.number` (the number, or empty) and `.san`. A variation move has no %. Only the replies of the line have a %.
- The viewed move has the class `viewed`, the background `amber` and the text `on-accent`. At the start position, no move has the class. The viewed move scrolls into view.

## The show function

`show()` asks `CurrentLine`. Then it draws all parts again. `at` is `viewed`, or `current` when `viewed` is `null`.

- The board gets the `fen` of node `at`, the side to move (field 2 of the FEN) and the orientation (the color of the line).
- **Line move.** When `viewed` is `null` and the status is `yourMove` or `tryAgain`, you move your color with `legalMoves`. In `tryAgain`, these are only the acceptable moves. A drop calls `trainer.yourMove`.
- **Variation move.** In all other conditions, you move the side to move of the position, with the moves from `ExploreMoves(at)`. A drop calls `trainer.exploreMove(at, move)`. Then the screen sets `viewed` to the child of `at` with this move (`childOf`), and calls `show()`. The first part of `exploreMove` puts the node in the tree before the call gives its promise, so the child is there.
- The board shows each arrow of the line in green, only at the current position. After a mistake, there is one arrow for each acceptable move. The engine shows no arrows in a variation.
- The board marks no last move.
- The bar gets `shownEval = barEval(pathEvals(nodes, at))`: the evals on the path from the start position to `at`. Then it sets the height of `#evalBarWhite` and the text of `#evalBarText`.
- Eval bar rule: the bar shows the eval of the position on the board. When that eval is `null`, the bar shows the eval of the nearest earlier position on the path that has an eval. When no earlier position has an eval, the bar is at 50 and has no number. For example, while the engine checks your move or a variation move, the bar shows the eval of the position before it. For Black, the start position has no eval, so the bar is at 50 there.
- The **New line** button is enabled only when the status is `yourMove`, `tryAgain` or `ended`. In these statuses, no answer is pending. Thus a late answer cannot go into a different line. You can explore in the same statuses.

| Status | Status text |
|---|---|
| `yourMove` | `your move` |
| `tryAgain` | `try again` |
| `checkingPosition` | `checking the position` |
| `checkingYourMove` | `checking your move` |
| `waitingForReply` | `waiting for the reply` |
| `ended` | `line ended` |

## Engine lines

The board is in explore mode when a drop is a variation move (see "The show function"), and the status is `yourMove`, `tryAgain` or `ended`. Thus the current position in `yourMove` or `tryAgain` is not in explore mode, because the lines would show the answer. An old position, a variation, or the current position after the line ends is in explore mode.

- Outside explore mode, `#engineLines` has the `hidden` attribute.
- In explore mode, `#engineLines` shows the `lines` of node `at`:
  - `null`: the text `The engine is thinking.`, and the screen calls `trainer.examine(at)`. The trainer asks the engine one time for each node, so each `show()` can call it.
  - `[]`: the text `No moves.`
  - Other values: one `.engineLine` for each line, best first. It holds `.score` (`lineScore(eval)`) and `.moves` (`lineMoves(fen, sans)`, with the `fen` of node `at`). For example `+0.3 2. Nf3 Nc6 3. Bb5`.
- The engine lines are from the White side, as the eval bar.

## Navigation

The screen keeps `viewed`: a node id, or `null` for the current position. It also keeps the `current` of the last `show()`.

| Key | Result |
|---|---|
| ← (`ArrowLeft`) | The parent of the viewed position. At the start position, no change. |
| → (`ArrowRight`) | The first child of the viewed position (the main child, or the next move of a variation). Without a child, no change. |
| ↑ (`ArrowUp`) | The start position. |
| ↓ (`ArrowDown`) | The current position (`null`). |

The navigation buttons do the same: **Start** is ↑, **Back** is ←, **Forward** is → and **End** is ↓. Each button has its key in `data-key`. A click calls `nextView` with this key.

- A click on a move shows the position of that move.
- If the result is `current`, `viewed` is `null`.
- At an old position or in a variation, the board has no arrows, and the message, the accuracy and the status show the current position. **New line** keeps its rule.
- When `current` changes, `viewed` goes back to `null`. Thus a reply, a take back or a new line shows the current position.
- When the focus is in an `input` or a `select`, the keys do not navigate. For the 4 arrow keys, the screen stops the default action. Thus ↑ and ↓ do not scroll the page.

## Big screen view

See the spec [Big screen view](superpowers/specs/2026-10-26-big-screen-design.md). On a screen wider than 760 pixels, only the board grows with the window. The text and the other parts keep their size.

- `--panel-width` (on `#app`) is `clamp(320px, 25vw, 480px)`. `#panel` has this width.
- `--board-size` (on `#app`) is `max(400px, min(100vh - 16px, 100vw - 56px - var(--panel-width)))`. The board fills the height of the window, without the margins of the body (2 × 8 pixels). It also fits the width that the eval bar (24 pixels), the gap (16 pixels), the panel and the margins leave. It is never smaller than 400 pixels. `#panel` and the eval bar have the height of the board.
- `#boardRow` has `overflow-y: clip`, because a rank number of chessground goes past the bottom of the board. When the board fills the height of the window, the page would scroll.
- `#app` is in the center of the window, from left to right.

## Mobile view

`index.html` has `<meta name="viewport" content="width=device-width, initial-scale=1">`. When the screen is 760 pixels wide or less (`@media (max-width: 760px)`):

- `#app` is a column. `#panel` is under `#boardRow`. Thus the move list is under the board. **New line** and the cog stay at the top of the panel.
- `#app` starts at the left.
- `--board-size` (on `#app`) is `min(400px, 100vw - 40px)`: the width of the screen without the eval bar (24 pixels) and the margins of the body (2 × 8 pixels). The board and the eval bar get this size. Chessground sees the new size with its `ResizeObserver`.
- `#panel` has the width of the board row and no fixed height. `#moveList` has a maximum height of 240 pixels and scrolls.
- `#boardRow` has `overflow-x: clip`, because the file letters of chessground go 24 pixels past the right side of the board. Thus the page does not scroll sideways.

```
+----+----------------------+
|░░░░|                      |
|▓▓▓▓|      board           |
|0.3 |                      |
+----+----------------------+
| [ New line ]      [⚙]     |
| 1.  e4     e5   42%       |
| 2.  Nf3   [Nc6] 61%       |
| [⏮] [◀] [▶] [⏭]           |
| Accuracy: ...             |
| Status: your move         |
| [Copy PGN] [Change token] |
+---------------------------+
```

## Delete

The screen sends `DeleteVariation` on the bus. It does not use the trainer, because the engine has no work.

- **Delete key.** When the viewed position is a variation node, the Delete key deletes it. When the focus is in an `input` or a `select`, the key does not delete.
- **Menu.** A right-click on a variation move opens `#moveMenu` at the mouse. A click on **Delete from here** deletes that move. A right-click on a move of the line opens the normal menu of the browser.
- After a delete, if the viewed position is not in the tree, `viewed` goes to the parent of the deleted node.
- `#moveMenu` is a manual popover (`popover="manual"`). On Linux, `contextmenu` comes on the mouse down, and the light dismiss of the browser would close the menu on the mouse up. Thus the screen closes the menu itself: on a `pointerdown` outside the menu, on the Escape key, and after a click on its button.

### Navigation functions (`src/ui/navigation.ts`)

| Function | Result |
|---|---|
| `nextView(key, viewed, nodes, current)` | The next `viewed` for a key, from the table above. Each result goes through `viewOf`. Other keys give no change. |
| `viewOf(id, current)` | `null` when `id` is `current`. In all other conditions, `id`. |
| `keptView(viewed, shownCurrent, current)` | `viewed` when `shownCurrent` is `current`. In all other conditions, `null`. |
| `childOf(nodes, at, uci)` | The id of the child of `at` with this `uci`, or `undefined`. |

## Copy PGN

A click on **Copy PGN** asks `CurrentLine` and gives `pgnText(nodes)` to `navigator.clipboard.writeText`. The PGN has the full move tree, with its variations, at all positions and in all statuses.

- After the copy, the button text is `Copied` for 1.5 seconds. Then it is `Copy PGN` again.
- If the browser does not copy, `#message` shows `The browser did not copy the PGN.`
- The PGN has no tags and no %. Lichess and chess programs accept a PGN with only movetext. For example `1. e4 e5 2. Nf3 (2. Bc4 Nf6) 2... Nc6 *`.

## Your move

When you drop a piece, the screen sends the move in UCI, for example `e2e4`, to `trainer.yourMove` or `trainer.exploreMove`. A pawn on rank 8 or rank 1 always becomes a queen. For this pawn, the screen adds `q`, for example `b7a8q`.

## New line

**New line** reads the rating field and the `Moves` field with `readNumber`. An empty field gives `NaN`. It reads the color from the `Color` field. Then it calls `trainer.start(rating, color, moves)`. If the promise of `start` rejects, `#message` shows the error message, for example `The rating must be a whole number, 0 or more.` or `The number of moves must be a whole number, 2 or more.`

## Text functions (`src/ui/text.ts`)

| Function | Result |
|---|---|
| `readNumber(text)` | The number in the text. An empty text, or a text with only spaces, gives `NaN`. |
| `moveRows(nodes)` | The items of the move list, in order (see "Move list"). An item is a row `{ number, white, black }` or a variation line `{ tokens }`. `white` and `black` are `{ id, san, percent }`. `black` is `null` when the row has only the White move. A token is `"("`, `")"` or a move `{ id, number, san }`. `number` is for example `2.`, `2...` or empty. The number of a move comes from the FEN of its node. |
| `pgnText(nodes)` | The movetext of the move tree in PGN, then the result `*`. Each variation is in parentheses, right after the move that it is an alternative to, as in PGN. This is not the same as the move list, where the variations of a node come after the row. The move numbers follow the rules of the move list: a White move always has its number, and a Black move has its number with `...` when it is the first move of a variation or comes after a variation. No moves give `*`. |
| `pathEvals(nodes, id)` | The evals from the start position to node `id`. |
| `statusText(status)` | The status text from the table above. |
| `barText(centipawns)` | `null` gives an empty text. `10000` and `-10000` give `M`. Other values give the pawns, rounded to one decimal, with no sign, as on chess.com. For example `30` gives `0.3`, `-120` gives `1.2`, and `-4` gives `0.0`. |
| `accuracyText(accuracy)` | `checked` 0 gives `–`. Other values give `correct of checked correct (percent%)`, with the percent rounded to a whole number. For example `{ 7, 9 }` gives `7 of 9 correct (78%)`. |
| `evalBarPercent(centipawns)` | `50 + 50 × (2 ÷ (1 + e^(−0.00368208 × centipawns)) − 1)`. `10000` gives 100. `-10000` gives 0. `0` gives 50. |
| `lineScore(centipawns)` | The eval of an engine line, from the White side, with its sign: `30` gives `+0.3`, `-120` gives `-1.2`, `10000` gives `+M` and `-10000` gives `-M`. A value that rounds to `0.0` has no sign. |
| `lineMoves(fen, sans)` | The moves of an engine line from the position of `fen`, with PGN move numbers. The first move of Black has `...`. For example, after `1. e4`, `["e5", "Nf3"]` gives `1... e5 2. Nf3`. |
| `barEval(evals)` | The last value that is not `null` in `evals`. If all are `null`, it gives `null`. For example, `[30, null]` gives 30. |

## Start of the app (`src/main.ts`)

`src/main.ts` connects the units:

1. It makes the `LineBus` and calls `attachLine`.
2. It makes a `StockfishEngine` with `` new Worker(`${import.meta.env.BASE_URL}stockfish/stockfish-19-lite-single.js`) ``.
3. It makes a `TokenStore` and a `SettingsStore` with `() => localStorage`. It makes a `SourceExplorer` with `() => settings.source()`, a `LichessExplorer` with `() => tokens.read()` and a `ChessComExplorer` with `() => settings.username()`.
4. It makes the `Trainer` with a `show` function that calls the `show` function of the screen.
5. It calls `mountTokenDialog(document.body, tokens)`. It gives its `open` function to `mountTrainer` as `changeToken`. It gives the settings store to `mountTrainer` as `settings`. Then it calls `show()`.
6. If `settings.source()` is `"lichess"` and `tokens.read()` is `""`, it opens the token dialog.

## Setup

1. Run `npm run dev`.
2. Paste your Lichess token in the token dialog. See [Token store and token dialog](token.md).

`chessground` 9.2.1 is GPL-3.0-or-later licensed. The screen uses its 3 style sheets: `chessground.base.css`, `chessground.brown.css` and `chessground.cburnett.css`. The fonts Karla and JetBrains Mono are OFL-1.1 licensed.

## Tests

- `src/ui/text.spec.ts` (Vitest) tests the text functions. `src/ui/navigation.spec.ts` tests the navigation functions.
- `e2e/features/opening-trainer.feature` (Cucumber.js and Playwright) has 20 scenarios. The first scenario also checks that the page background is `rgb(22, 17, 13)` (`surface-100`), and that the font Karla is loaded (`document.fonts`). One scenario is for Black, one for the number of moves, one for a mistake and its refutation, one for the navigation, one for a phone, one for a big monitor, one for an exploration from an old position, one for the engine lines, one for a delete, one for Copy PGN, one for the cog, 2 for the token dialog, and 4 for the source chess.com (see [chess.com explorer](chess-com-explorer.md)). The scenario of a mistake checks the fixed message `Ba6 loses 6.4 pawns. Play Nf3, Nc3 or Bc4.` and the fixed refutation `(2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)`. The real Stockfish gives the same scores and lines each time, so they do not change. Only the scenario of 5 moves and the scenario of 3 moves change the `Moves` field. The other scenarios keep the start value of 10. The Background has the explorer table and opens the app. Each scenario starts the line. The step of an explorer table first removes the earlier explorer route, so the table of a scenario replaces the table of the Background. Playwright gives fixed explorer answers. Before each scenario, an init script puts the token `e2e-token` in `localStorage`, when there is no token. Scenarios with the tag `@withoutToken` get no init script. Thus the tests need no real token and no network. The real Stockfish runs in the browser.
- 2 scenarios are for the [token dialog](token.md). `@withoutToken` The app asks for your token: the dialog is open with no **Cancel**, Escape does not close it, an empty token shows `Paste your Lichess token.`, the saved token goes to the explorer, and after a reload the dialog stays closed. You change the token: **Change token**, a new token, and the explorer gets it. The step of an explorer table keeps the `Authorization` header of each request in `AppWorld.authorizations`. The step `the explorer got the token {string}` waits until the last header is `Bearer <token>`.
- The step `the moves are` waits until the text that `AppWorld.waitForMoves` makes from `#moveList` is the text of the step. It reads the rows and the variation lines in order. For each row, it takes the number, then the SAN of each move, with ` (42%)` after a move with a %. A variation line gives its tokens with spaces, but with no space after `(` and before `)`, for example `(2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)`. Thus the texts in the feature stay `1. e4 e5 (42%) 2. Nf3`.
- The steps that use the `Rating`, `Color` and `Moves` fields open the cog first if `#settings` is closed (`AppWorld.openSettings`). The steps `the player right-clicks the move {string}`, `the player clicks {string}` (a button by its name), `the player clicks the cog`, `the settings are open` and `the settings are closed` (`:popover-open`) are for the variations and the cog.
- The navigation scenario uses the steps `the player presses {string}`, `the player presses {string} in the {string} field`, `the player clicks the move {string}`, `the highlighted move is {string}` and `the board has a {string} on {string}`. `AppWorld.waitForPiece(piece, square)` waits until a `cg-board piece` with the classes of the piece (for example `black knight`) has a `translate` on that square. The square math is the inverse of the clicks of `AppWorld.play`.
- The engine lines scenario uses the steps `the engine shows {int} lines from {string}` and `the engine lines are hidden`. The first waits for that number of `.engineLine` items. It checks that each `.score` is `+0.3`, `-1.2`, `0.0`, `+M` or `-M` in form, and that each `.moves` starts with the text (for example `1... `). The real Stockfish runs, so the step does not check the moves.
- The Copy PGN scenario plays a line with a variation and clicks **Copy PGN**. The step `the clipboard has {string}` reads `navigator.clipboard.readText()`. Each browser context gets the permissions `clipboard-read` and `clipboard-write`. The step `the Copy PGN button shows {string}` checks the text `Copied`.
- The phone scenario uses the step `the screen is {int} by {int} pixels` (`page.setViewportSize`), with 390 × 844 pixels. The step `the move list is under the board` checks that the top of `#moveList` is under the bottom of `#board`. The step `the page does not scroll sideways` checks that the `scrollWidth` of the page is not more than its `clientWidth`. The scenario clicks the navigation buttons with `the player clicks {string}`.
- The big monitor scenario uses the screen 1920 × 950 pixels: a 1080p monitor without the bars of the browser, where the height of the window limits the board. The step `the board is more than {int} pixels wide` checks the width of `#board`. The step `the move list is at the right of the board` checks that the left of `#moveList` is at the right of the board. The step `the text of the move list is {int} pixels` checks the computed `font-size` of `#moveList`. The step `the page does not scroll down` checks that the `scrollHeight` of the page is not more than its `clientHeight`.
- The explorer answer in the e2e tests is one row of the table in the feature. The row is the full move number of the FEN (field 6), counted from 1. The third column of the row is the % of the move. The answer has the position total 100, so the screen shows this %.
- A scenario that navigates after its moves first waits for `the status is "your move"`. `AppWorld.play` returns when the screen shows your move, before the reply comes. When the reply comes, `current` changes and `viewed` goes back to `null`. Thus a navigation before the reply is lost. On a slow computer, for example in CI, the reply comes late, so a scenario without the wait fails only sometimes.
- `AppWorld.navigate(action)` stops a navigation before the reply. The navigation steps use it: `the player presses {string}` with an arrow key, `the player clicks {string}` with `Start`, `Back`, `Forward` or `End`, and `the player clicks the move {string}`. When `#status` is not `Status: your move`, `Status: try again` or `Status: line ended`, the step fails at once with the status and the step to add. Thus a scenario without the wait fails each time, not only on a slow computer.
- `AppWorld.play(move)` also plays a variation move: it clicks the squares on the board, as for a line move. It waits for `Status: your move` or `Status: try again`. It keeps the move list and the status. Then it clicks the 2 squares (for the Black side of the board, the click position is turned around), and waits until the text of `#moveList` or the status changes. Thus the next move does not start before the screen shows the move. (After a mistake, the move list can stay the same, but the status changes.)
