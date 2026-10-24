---
type: spec
title: Try again, move list, eval number and dark mode
description: The design of 4 changes to the opening trainer. After a mistake, you play one of a maximum of 3 acceptable moves. The moves are in a list at the side of the board, and the arrow keys move through them. The eval bar shows the eval number. The screen is dark.
tags: [spec, opening, trainer, mistake, move-list, navigation, eval, dark-mode]
---

# Try again, move list, eval number and dark mode

This spec changes the [Eval, accuracy, line length and Black](2026-10-24-eval-accuracy-length-black-design.md) spec. The parts that this spec does not name stay the same.

## Goal
The screen looks and works more like chess.com:

1. The moves are in a list at the side of the board. The arrow keys and a click move through the moves.
2. When you make a mistake, the app does not play the best move for you. It takes back your move and shows a maximum of 3 acceptable moves. You play one of them. Then the line continues.
3. The eval bar shows the eval number.
4. The screen is dark.

Success: you train a line, and the screen feels like chess.com.

## Decisions
| Subject | Decision |
|---|---|
| Acceptable move | A move that loses 20 centipawns or less, compared with the best move of the engine. The screen shows a maximum of 3. The best move is always one of them. |
| After a mistake | The app takes back your move. Green arrows show the acceptable moves. The board lets you play only those moves. |
| Accuracy | The mistake counts as not correct. Your second move does not count. |
| Engine lines | Before each of your moves, the engine examines the position with 3 lines (MultiPV 3). |
| Move list | One row for each move number, as on chess.com. The % of each opponent move stays. Your mistake is not in the list. |
| Navigation | ← one move back, → one move forward, ↑ the start position, ↓ the current position. A click on a move shows the position after that move. |
| Eval number | On the bar, at the end of the side that is better. No sign. `M` for mate. The `Eval:` line goes away. |
| Dark mode | Always dark, with chess.com colors. There is no switch. The board stays brown. |

## Facts that we checked (2026-10-24)
- Stockfish 19 lite single, in Node, depth 16, 4 opening positions: 1 line takes 0.2 s on average. 3 lines take 0.6 s on average. Thus the wait before each of your moves is approximately 0.4 s longer.
- After 1. e4 e5, MultiPV 3 at depth 16 (after `ucinewgame`) gives `g1f3` +19, `b1c3` +8, `f1c4` +8. Two runs gave the same result. After that, `go depth 16 searchmoves f1a6` gives -624. Thus the loss of Ba6 is 643 and all 3 candidates are acceptable.
- We ran the engine calls of the e2e scenarios with MultiPV 3. All moves of the current scenarios stay acceptable. In the scenario of 5 moves, `f1b5` is the 2nd candidate (+32, the best is `d2d4` +33).

## Architecture
The bus stays synchronous, and handlers must not call `send`. The trainer stays the one async unit. Only `src/line/` holds chess rules.

| Unit | Change |
|---|---|
| `src/line/` | The type `Candidate`. The verdict holds the candidates. The new status `tryAgain`. A list of arrows. The `fen` of each move. |
| `src/engine/` | `analyse` gives a maximum of 3 candidates. |
| `src/trainer/` | It keeps the candidates. Your score can come from a candidate. |
| `src/ui/` | The side panel, the move list, the navigation, the number on the eval bar, dark mode. |

### Line (`src/line/`)

#### Types
- `Candidate` is `{ move, score }`. It is one line of the engine. `move` is UCI. `score` is in centipawns from your side.
- `Verdict` is `{ candidates, yourScore }`. `candidates` has 1 to 3 items, best first. It replaces `bestMove` and `bestScore`.
- `PlayedMove` is `{ san, percent, fen, eval }`. `fen` is the position after the move. `eval` is the eval of the position after the move, or `null`.
- `LineView` gets `startEval`: the eval of the start position, or `null`.
- The line keeps one eval for each position (`evals`): the start position and the position after each move. Each move adds `null`. A take-back removes the last item. The eval of the line is the last item.
- `Status` gets the new value `tryAgain`: you made a mistake, and you must play an acceptable move.

#### Acceptable moves
An acceptable move is a candidate with `candidates[0].score - candidate.score` of 20 or less. The first candidate is always acceptable. Thus there are 1, 2 or 3 acceptable moves.

#### Commands
| Command | Result |
|---|---|
| `StartLine(rating, color, moves)` | As now. It also clears the acceptable moves. |
| `JudgeYourMove(verdict)` | See "Judging your move". |
| `PlayYourMove(move)` | When the status is `tryAgain`: see "Your second move". In all other statuses: as now. |
| `JudgePosition`, `PlayReply`, `StopLine` | No change. |

#### Judging your move
The loss is `candidates[0].score - yourScore`. Your move is the best move when it is `candidates[0].move`. The handler compares the moves as UCI (`lan`), as now.

| Condition | Message |
|---|---|
| Your move is the best move. | `Best move.` (No change.) |
| The loss is 20 or less. | `Good. The best move was Nf3.` (No change.) |
| The loss is more than 20, and `yourScore` is -10000. | `g4 allows mate. Play e4.` |
| The loss is more than 20, and `candidates[0].score` is +10000. | `Bc4 misses a mate. Play Qxf7#.` |
| The loss is more than 20 in all other conditions. | `Bc4 loses 0.8 pawns. Play Nf3, Bb5 or d4.` |

The list of moves after `Play`:
- 1 acceptable move: `Play Nf3.`
- 2 acceptable moves: `Play Nf3 or Bb5.`
- 3 acceptable moves: `Play Nf3, Bb5 or d4.`

The SAN of each acceptable move comes from the position before your move. The moves are in the order of the candidates.

When the loss is 20 or less, the handler does the steps of now: your move stays, it sets the eval from `yourScore`, and it adds 1 to `checked` and to `correct`. Then the end rules apply.

When the loss is more than 20 (a mistake), the handler does these steps:

1. It takes back your move. It also removes the last item of the % list.
2. It sets the message from the table above.
3. It keeps the acceptable moves.
4. It sets the arrows: one arrow for each acceptable move.
5. It sets the eval from `candidates[0].score`, changed to the White side.
6. It adds 1 to `checked`. It does not add 1 to `correct`.
7. It sets the status to `tryAgain`. The end rules do not apply.

#### Your second move
When the status is `tryAgain`, `PlayYourMove(move)` does these steps:

1. It plays the move. It adds `null` to the % list.
2. It clears the message and the arrows.
3. It sets the eval from the score of the acceptable move with this `move`, changed to the White side.
4. It clears the acceptable moves.
5. The end rules apply.

The move needs no check. The accuracy does not change. The board lets you play only the acceptable moves, so the line does not check the move again.

#### End rules
The end rules are now in 2 handlers. Thus they move into one method of `LineState`:

- If the move on the board gives checkmate, the line ends with `Checkmate.` at the end of the message.
- If not, the line ends after your move number `moves`.
- In all other conditions, the status is `waitingForReply`.

#### Query
`CurrentLine` gives:

| Field | Value |
|---|---|
| `moves` | `{ san, percent, fen }[]`. `CurrentLine` makes each `fen` from the `chess.js` history. |
| `status` | Also `tryAgain`. |
| `arrows` | `Arrow[]`. It replaces `arrow`. It is empty when there is no arrow. |
| `legalMoves` | When the status is `yourMove`: all legal moves, as now. When the status is `tryAgain`: only the acceptable moves. In all other statuses: empty, as now. |
| All other fields | No change. |

### Engine (`src/engine/`)
- `Candidate` is in `src/line/messages.ts`. The engine imports it, as the explorer imports `Reply`.
- `analyse(fen)` gives `Candidate[]`, best first. It replaces the `Analysis` type.
- The UCI sequence of `analyse`: `setoption name MultiPV value 3`, `ucinewgame`, `isready` (wait for `readyok`), `position fen <fen>`, `go depth 16`.
- Each `info` line with a score has `multipv N` and `pv <move> ...`. `analyse` keeps the last of these lines for each `N`. It gives the candidates in the order of `N`. When the position has fewer than 3 legal moves, there are fewer candidates.
- The parse of `score cp` and `score mate` does not change.
- `score(fen, move)` does not change. With `searchmoves` and one move, Stockfish gives only 1 line.
- The UCI sequence is the same each time, and the search has 1 thread. Thus the results stay stable for the e2e tests.

### Trainer (`src/trainer/`)
- The `Engine` type is `{ analyse(fen): Promise<Candidate[]>; score(fen, move): Promise<number> }`.
- The trainer keeps the candidates of the last `analyse`.
- The prepare steps send `JudgePosition(candidates[0].score)`.
- `yourMove`, when the status is `checkingYourMove`: if `move` is the `move` of a candidate, `yourScore` is the score of that candidate. If not, `yourScore` comes from `engine.score(fenBefore, move)`. Then the trainer sends `JudgeYourMove({ candidates, yourScore })`.

The flow of a mistake needs no new trainer step:

1. After `JudgeYourMove`, the status is `tryAgain`. The prepare steps do nothing, so the trainer stops.
2. Your second move calls `yourMove` again. `PlayYourMove` sets `waitingForReply` or `ended`. Thus there is no check, and the prepare steps get the reply.

### Screen (`src/ui/`)

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

#### Parts
| Part | Content |
|---|---|
| `#boardRow` | The eval bar and the board, as now. |
| `#panel` | The side panel, on the right of `#boardRow`. It has the height of the board. It holds the fields, **New line**, `#moveList`, `#message`, `#accuracy` and `#status`. |
| `#moveList` | One row for each move number. The move list fills the free height of the panel and scrolls. |
| `#evalBar` | 24 pixels wide, not 16. All other rules of the bar do not change. |
| `#evalBarText` | The number on the bar. See "Eval bar". |
| `#eval` | Goes away. |

The fields, **New line**, `#message`, `#accuracy` and `#status` do not change.

#### Board
- The board shows the viewed position. See "Navigation".
- At the current position, the board shows the arrows of `CurrentLine` in green. You can move when the status is `yourMove` or `tryAgain`. The board lets you drop a piece only on a square from `legalMoves`.
- At an old position, the board is locked and has no arrows.
- **New line** is enabled when the status is `yourMove`, `tryAgain` or `ended`. In `tryAgain`, no answer is pending, so you can start a new line.

#### Move list
- A row has the move number, the White move and the Black move. The last row can have only the White move.
- An opponent move has its % after it, in small grey text, for example `e5 42%`.
- The viewed move has a highlight. At the current position, the last move has the highlight. At the start position, no move has the highlight.
- The row of the viewed move scrolls into view.
- A click on a move shows the position after that move.

#### Navigation
The screen keeps `viewed`: the number of moves of the viewed position, or `null` for the current position.

`nextView(key, viewed, moveCount)` in `src/ui/navigation.ts` gives the next `viewed`:

| Key | Result |
|---|---|
| `ArrowLeft` | One move back. From `null`, `moveCount - 1`. It does not go below 0. |
| `ArrowRight` | One move forward. From `null`, `null`. |
| `ArrowUp` | 0 (the start position). |
| `ArrowDown` | `null`. |
| Other keys | No change. |

A result that is `moveCount` or more gives `null`. A click on the move with index `i` (from 0) gives `i + 1`, with the same rule.

- The position of `viewed` 0 is the start position. The position of `viewed` `n` is the `fen` of move `n`.
- When the number of moves changes, `viewed` goes back to `null`.
- When the focus is in an `input` or a `select`, the keys do not navigate.
- For the 4 arrow keys, the screen stops the default action. Thus ↑ and ↓ do not scroll the page.
- The eval bar shows the viewed position. The message, the accuracy and the status always show the current position.

#### Eval bar
- `barEval(evals, position)` gives the eval that the bar shows. `evals` is `startEval` and then the `eval` of each move. `position` is `viewed`, or the number of moves at the current position. It gives the eval of `position`. When that eval is `null`, it gives the nearest earlier eval that is not `null`. When there is no such eval, it gives `null`. At the current position, this gives the rule of before.
- The height of `#evalBarWhite`: 50 % when `barEval` is `null`. In all other conditions, `evalBarPercent(barEval)` %.
- `#evalBarText` shows `barText(barEval)`.
- When `barEval` is 0 or more, the text is at the White end of the bar, in dark text. When `barEval` is less than 0, the text is at the Black end, in light text. The White end is at the bottom for White, and at the top for Black.

#### Dark mode
The screen is always dark.

| Part | Color |
|---|---|
| Page | `#302E2B` |
| Panels | `#262522` |
| Text | `#FFFFFF` |
| Grey text (the %) | `#989795` |
| Highlight of the viewed move | `#484644` |
| **New line** | `#81B64C` |

The page has `color-scheme: dark`. Thus the fields and the select are also dark. The board and the eval bar keep their colors.

#### Text functions (`src/ui/text.ts`)
| Function | Result |
|---|---|
| `moveRows(moves)` | New. It replaces `moveList`. It gives one `{ number, white, black }` for each move number. `white` and `black` are `{ index, san, percent }`. `index` is the index in `moves`, from 0. `black` is `null` when the row has only the White move. |
| `barText(eval)` | New. `null` gives an empty text. `10000` and `-10000` give `M`. Other values give the pawns with one decimal and no sign. For example `30` gives `0.3`, and `-120` gives `1.2`. |
| `barEval(evals, position)` | New. It replaces `evalBarHeight`. See "Eval bar". |
| `statusText(status)` | New: `tryAgain` gives `try again`. |
| `evalText(eval)` | Goes away. |
| `readNumber`, `accuracyText`, `evalBarPercent` | No change. |

## Errors
No change.

## Tests
Each spec file has a `*.steps.ts` file, as now. We write each case red, then green, then refactor. The current cases change to the new types. For example, a verdict has `candidates`, not `bestMove` and `bestScore`.

### Unit specs (Vitest)
| Spec | New cases |
|---|---|
| `src/line/line.spec.ts` | A mistake gives the status `tryAgain`. It takes back the move and its %. It gives one arrow and one legal move for each acceptable move. The message for 1, 2 and 3 acceptable moves. The messages for `allows mate` and `misses a mate`. A candidate that loses more than 20 is not acceptable. The eval comes from the first candidate. `checked` gets 1, and `correct` does not change. A good move that is the 2nd candidate stays. After `tryAgain`, `PlayYourMove` sets the eval from that candidate, does not change the accuracy, and gives `waitingForReply`. It ends the line on your last move and on checkmate. Each `PlayedMove` has the `fen` and the eval after the move. `startEval` is the eval of the start position. A mistake also takes back the eval of its move. |
| `src/engine/engine.spec.ts` | `analyse` sends `setoption name MultiPV value 3` first. It keeps the last line for each `multipv`. It gives the candidates in order. With 2 legal moves, it gives 2 candidates. Mate scores. |
| `src/trainer/trainer.spec.ts` | Your move is the 2nd candidate: no `score` call, and `yourScore` is the score of that candidate. A move that is not a candidate gets a `score` call. After a mistake, the trainer stops. The second move gets no check and gets a reply. |
| `src/ui/text.spec.ts` | `moveRows` for White and for Black, with an even and an odd number of moves. `barText` for `null`, `10000`, `-10000`, `30` and `-120`. `barEval` for each row of the rule. `statusText` for `tryAgain`. |
| `src/ui/navigation.spec.ts` (new) | `nextView` for each key, from `null` and from a number. ← at 0 stays at 0. → at the last move gives `null`. ↑ with 0 moves gives `null`. Other keys give no change. |

### E2E (Cucumber and Playwright)
- `AppWorld.play(move)` waits for `Status: your move` or `Status: try again`.
- The step `the moves are` reads the rows of `#moveList`. It makes the same text as now, for example `1. e4 e5 (42%) 2. Nf3`. Thus the texts of the current scenarios do not change.
- A new step finds the piece on a square from the board. It uses the same square math as the clicks.
- New steps: `the player presses {string}` (a key), `the player clicks the move {string}`, `the highlighted move is {string}`, `the board has a {string} on {string}`, `the eval bar shows a number`, `the eval bar shows no number` and `the page background is {string}`.

Scenarios in `e2e/features/opening-trainer.feature`:

1. The app replies to your first move. It also checks that the page background is `rgb(48, 46, 43)`.
2. Changed: after a mistake, you play an acceptable move.
   ```
   Given the player starts a line with the rating "1450"
   When the player plays "e2e4 f1a6"
   Then the message is "Ba6 loses 6.4 pawns. Play Nf3, Nc3 or Bc4."
   And the status is "try again"
   And the moves are "1. e4 e5 (42%)"
   And the accuracy is "0 of 1 correct (0%)"
   When the player plays "g1f3"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%)"
   And the eval bar has a height
   And the eval bar shows a number
   ```
3. The line ends after 5 of your moves. (No change.)
4. Lichess does not accept the token. (No change.)
5. You play Black. At the end, it also checks the eval bar at the start position, which has no eval for Black:
   ```
   And the eval bar shows a number
   When the player presses "ArrowUp"
   Then the eval bar shows no number
   When the player presses "ArrowDown"
   Then the eval bar shows a number
   ```
6. The line ends after the number of moves that you choose. (No change.)
7. New: you move through the moves.
   ```
   Given the player starts a line with the rating "1450"
   When the player plays "e2e4 g1f3"
   Then the status is "your move"
   When the player presses "ArrowLeft"
   Then the highlighted move is "Nf3"
   And the board has a "black knight" on "b8"
   When the player presses "ArrowUp"
   Then the board has a "white pawn" on "e2"
   When the player presses "ArrowDown"
   Then the highlighted move is "Nc6"
   And the board has a "black knight" on "c6"
   When the player clicks the move "e4"
   Then the highlighted move is "e4"
   And the board has a "black pawn" on "e7"
   ```

The step `the eval shows a pawn value` goes away, because `#eval` goes away.

## Documentation
These OKF pages change: `Docs/line.md`, `Docs/engine.md`, `Docs/trainer.md` and `Docs/trainer-screen.md`. `Docs/index.md` links to this spec. The older specs stay as they are. This spec tells what changes.

## Not included
- A highlight of the last move on the board.
- A light mode and a switch.
- The green board of chess.com.
- A choice of promotion piece.
- A search in the background while you think.
