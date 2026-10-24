---
type: spec
title: Eval, accuracy, line length and Black
description: The design of 5 additions to the opening trainer. The screen shows the % of each opponent move, the eval, an eval bar and your accuracy. You can set the line length, and you can play Black.
tags: [spec, opening, trainer, eval, accuracy, black]
---

# Eval, accuracy, line length and Black

This spec changes the [Opening trainer](2026-10-23-opening-trainer-design.md) spec. The parts that this spec does not name stay the same.

## Goal
The trainer gives you more data about each line:

1. The screen shows how often players at your level play each opponent move, as a % of all games in the position.
2. The screen shows the eval of the current position, as a text and as an eval bar.
3. You can set the number of moves of a line. The default is 10.
4. The screen shows your accuracy: the % of your checked moves that are correct.
5. You can play Black. The app picks the first White move from the explorer, as it picks all replies.

## Decisions
| Subject | Decision |
|---|---|
| Your color | White or Black. You choose it before each line. The default is White. |
| First White move when you play Black | The app picks it from the explorer with the same weighted pick as all replies. |
| Your first move | The engine does not check it, for both colors. It is not in your accuracy. |
| Line length | The number of your moves, also your first move. 10 moves = 1 free move + 9 checked moves. The move list ends at move 10. |
| Line length setting | A whole number of 2 or more. You type it before each line. The default is 10. |
| Opponent % | `round(games × 100 ÷ total)`. `total` is all games at your level in the position. The values of the 5 replies do not always add up to 100%. |
| Eval | The engine score of the position on the board, from the White side, as on Lichess. For example `+0.3`, `-1.2`, `mate for Black`. |
| When the eval changes | Before each of your moves, the engine examines the position. After the check of your move, the eval is the score of the move on the board. |
| Eval bar | A vertical bar on the left of the board. Its height comes from the Lichess win-chance curve. |
| Accuracy | Correct moves ÷ checked moves, rounded to a whole %. A correct move loses 20 centipawns or less. |
| Settings | The page keeps the rating, the color and the moves only while it is open. |
| After a line | The app keeps no data. |

## Facts that we checked (2026-10-24)
- The explorer answer has the top-level fields `white`, `draws` and `black` for the position. At the start position with the band 1400, the total is 967 125 434 games, and `e4` is 626 405 121 games (65%).

## Architecture
The bus stays synchronous, and handlers must not call `send`. The trainer stays the one async unit.

The engine search is split into 2 calls. Before each of your moves, the trainer calls `analyse`. The trainer keeps the result for the check of your next move. After your move, the trainer calls `score` only when your move is not the best move. Thus the total engine time stays almost the same as now. Only the position before your first move needs one more search. The wait moves to the time before your move: after each reply, the board is locked for one engine search.

| Unit | Change |
|---|---|
| `src/line/` | Color, line length, eval, accuracy, the % of each reply, the new status `checkingPosition`, the new command `JudgePosition`. |
| `src/engine/` | `judge` is replaced by `analyse` and `score`. |
| `src/explorer/` | Each reply gets `percent`. |
| `src/trainer/` | `start` is async. The prepare steps before each of your moves. |
| `src/ui/` | Color and moves fields, eval text, eval bar, accuracy text, the % in the move list, the board from your side. |

### Line (`src/line/`)

#### Scores
The scores are in centipawns from **your** side, not from the White side. The engine always runs when it is your move, so the side to move is your side. A mate for you is +10000. A mate for the opponent is -10000. Thus `loss = bestScore - yourScore` and the messages of `JudgeYourMove` do not change.

The line keeps the eval from the White side. When you play White, the eval is the score. When you play Black, the eval is `-score`.

#### Commands
| Command | Result |
|---|---|
| `StartLine(rating, color, moves)` | `color` is `white` or `black`. It checks the rating first, as now. Then, if `moves` is not a whole number of 2 or more, it throws `The number of moves must be a whole number, 2 or more.` When it throws, the state does not change. If not, it starts a new line at the start position. The message is empty, there is no arrow, the eval is `null`, and the accuracy is 0 of 0. Status: `checkingPosition` for White, `waitingForReply` for Black. |
| `PlayReply(replies)` | Picks one reply and plays it, as now. It keeps the `percent` of the picked reply. It sets the eval to `null`. The message and the arrow stay. Status: `checkingPosition`. If `replies` is empty, the line ends, as now. |
| `JudgePosition(score)` (new) | Sets the eval from `score`. Status: `yourMove`. |
| `PlayYourMove(move)` | As now. It also sets the eval to `null`. Status: `waitingForReply` for your first move, `checkingYourMove` for each other move. |
| `JudgeYourMove(verdict)` | As now. It also does these steps. It adds 1 to `checked`. If the loss is 20 or less, it adds 1 to `correct`. It sets the eval: from `yourScore` if your move stays, from `bestScore` if the best move replaces it. |
| `StopLine(message)` | No change. |

After `JudgeYourMove`: if the move on the board gives checkmate, the line ends with `Checkmate.`, as now. If not, the line ends after the check of your move number `moves`. In all other conditions the status is `waitingForReply`.

The % of each move is in a list next to the `chess.js` history. `PlayYourMove` adds `null`. `PlayReply` adds the `percent`. When the best move replaces your move, the number of moves does not change, so the list stays correct.

#### Query
`CurrentLine` gives:

| Field | Value |
|---|---|
| `fen` | No change. |
| `color` | `white` or `black`. Before the first line: `white`. |
| `moves` | `{ san, percent }[]`. `percent` is `null` for your moves. |
| `status` | `yourMove`, `checkingPosition`, `checkingYourMove`, `waitingForReply` or `ended`. |
| `message`, `arrow`, `legalMoves` | No change. |
| `eval` | Centipawns from the White side, or `null`. |
| `accuracy` | `{ correct, checked }`. |

The new status `checkingPosition` means that the engine examines the position before your move.

#### Types
- `Reply` is `{ uci, san, games, percent }`.
- `Color` is `"white" | "black"`.
- `Verdict` does not change: `{ bestMove, bestScore, yourScore }`.

### Engine (`src/engine/`)
`judge` is replaced by 2 calls. Both wait for `uciok`.

| Call | UCI commands | Result |
|---|---|---|
| `analyse(fen)` | `ucinewgame`, `isready` (wait for `readyok`), `position fen <fen>`, `go depth 16` | `{ bestMove, score }` |
| `score(fen, move)` | `position fen <fen>`, `go depth 16 searchmoves <move>` | the score |

The last `score` before `bestmove` gives the score, as now. The scores are from the side to move. The parsing of `score cp` and `score mate` does not change. After a worker `error` event, the current call and each later call throws `The engine did not start. Reload the page.`, as now.

The UCI sequence of `analyse` and then `score` is the same as the sequence of the current `judge`. Thus the engine gives the same results each time, and the e2e tests stay stable.

`analyse` and `score` must not run at the same time. The trainer waits for the end of one call before the next.

### Explorer (`src/explorer/`)
Each reply gets `percent = Math.round(games × 100 ÷ total)`. `total` is `white + draws + black` of the top-level fields of the answer. `games` is `white + draws + black` of the move, as now. The URL, the castling change and the errors do not change.

### Trainer (`src/trainer/`)
The trainer keeps the rating and the last analysis. It holds no rules. The `Engine` type is `{ analyse(fen): Promise<Analysis>; score(fen, move): Promise<number> }`.

`start(rating, color, moves)` is async:

1. Send `StartLine(rating, color, moves)`. If it throws, the promise rejects with that error, and the trainer does no more steps.
2. Call `show()`.
3. Do the prepare steps.

`yourMove(move)`:

1. Ask `CurrentLine` for the FEN before your move.
2. Send `PlayYourMove(move)`.
3. If the status is `checkingYourMove`: if `move` is the `bestMove` of the kept analysis, `yourScore` is the kept score. If not, get `yourScore` from `engine.score(fenBefore, move)`. Then send `JudgeYourMove({ bestMove, bestScore, yourScore })` with the kept analysis.
4. If the status is not `ended`: do the prepare steps.

The prepare steps:

1. If the status is `waitingForReply`: get the replies from the explorer for the FEN of the line now. Then send `PlayReply(replies)`.
2. If the status is `checkingPosition`: get the analysis from `engine.analyse(fen)` for the FEN of the line now, and keep it. Then send `JudgePosition(analysis.score)`.

The trainer calls `show()` after each command. If the engine, the explorer, a handler or `show()` throws after `StartLine`, the trainer sends `StopLine(error.message)`, calls `show()` and stops, as now.

### UI (`src/ui/`)
```
Rating [ 1450 ]  Color [ White ▾ ]  Moves [ 10 ]  [ New line ]
+--+-------------+
|  |             |
|▓▓|    board    |
|▓▓|             |
+--+-------------+
1. e4 e5 (42%) 2. Nf3 Nc6 (61%) 3. Bb5 a6 (55%)
Bc4 loses 0.8 pawns. The best move is Bb5.
Eval: +0.3
Accuracy: 7 of 9 correct (78%)
Status: your move
```

| Part | Content |
|---|---|
| `Color` field | A select with `White` (value `white`) and `Black` (value `black`). The default is `White`. |
| `Moves` field | The line length. The default value is `10`. |
| `#evalBar` | A vertical bar on the left of the board, with the same height as the board. The White part (`#evalBarWhite`) starts at the White side of the board: at the bottom for White, at the top for Black. Its height is `evalBarPercent(eval)` %. |
| `#moves` | The moves with move numbers and the % of each opponent move. |
| `#eval` | `Eval: ` and `evalText(eval)`. |
| `#accuracy` | `Accuracy: ` and `accuracyText(accuracy)`. |

- The board shows the position from your side (`color` from `CurrentLine`).
- You can move only pieces of your color, and only when the status is `yourMove`.
- A pawn that you move to the last rank always becomes a queen: rank 8 for White, rank 1 for Black. For example, the UI sends `b2a1q`.
- **New line** is enabled only when the status is `yourMove` or `ended`. Thus a late answer cannot go into a different line.
- **New line** reads the rating and the moves with `readNumber`, and the color from the select. Then it calls `trainer.start(rating, color, moves)`. If the promise rejects, `#message` shows the error message.
- The eval bar: when the eval is not `null`, the bar shows it. When the eval is `null` and the move list is empty, the bar is at 50. When the eval is `null` and the move list is not empty, the bar keeps its last height.

#### Text functions (`src/ui/text.ts`)
| Function | Result |
|---|---|
| `readNumber(text)` | The new name of `readRating`. The behavior does not change. |
| `moveList(moves)` | The moves with move numbers. It adds ` (42%)` after each move that has a percent. For White: `1. e4 e5 (42%) 2. Nf3`. For Black: `1. e4 (52%) e5`. |
| `evalText(eval)` | `null` gives `–`. `10000` gives `mate for White`. `-10000` gives `mate for Black`. Other values: the pawns with one decimal, and a `+` before a positive value. For example `30` gives `+0.3`, `-120` gives `-1.2`, and `0` gives `0.0`. |
| `accuracyText(accuracy)` | `checked` 0 gives `–`. Other values: `7 of 9 correct (78%)`. The % is rounded. |
| `evalBarPercent(eval)` | `50 + 50 × (2 ÷ (1 + e^(−0.00368208 × eval)) − 1)`. `10000` gives 100. `-10000` gives 0. `0` gives 50. |
| `statusText(status)` | New: `checkingPosition` gives `checking the position`. |

## Errors
| Problem | Message |
|---|---|
| The number of moves is not a whole number of 2 or more. | `The number of moves must be a whole number, 2 or more.` The line does not start. |

All other errors do not change.

## Tests
Each spec file has a `*.steps.ts` file, as now. We write each case red, then green, then refactor. The current cases change to the new flow. For example, after `PlayReply` the status is `checkingPosition`.

### Unit specs (Vitest)
| Spec | New cases |
|---|---|
| `src/line/line.spec.ts` | White starts with `checkingPosition`. Black starts with `waitingForReply`. The moves values 1 and 2.5 are rejected, and the state does not change. `JudgePosition` sets the eval and the status `yourMove`. For Black, the eval is `-score`. `PlayReply` keeps the `percent` and goes to `checkingPosition`. `PlayYourMove` sets the eval to `null` and adds a move with the percent `null`. `JudgeYourMove` sets the eval from `yourScore` when your move stays, and from `bestScore` when the best move replaces it. The accuracy counts a best move and a good move as correct, and a bad move as not correct. With 3 moves, the line ends after your third move, for White and for Black. |
| `src/engine/engine.spec.ts` | `analyse` sends its UCI sequence and gives `bestMove` and `score`. `score` sends `searchmoves` and gives the score. Mate scores for both calls. A worker error for both calls. |
| `src/explorer/explorer.spec.ts` | With a total of 200 games, a move with 84 games gives 42. The % is rounded. |
| `src/trainer/trainer.spec.ts` | White start: `StartLine`, `analyse`, `JudgePosition`. Black start: `StartLine`, explorer, `PlayReply`, `analyse`, `JudgePosition`. Your best move gives no `score` call. Another move gives a `score` call with the FEN before your move. No check for your first move. No reply and no analysis after the line ends. An error from `StartLine` rejects the promise. An engine or explorer error sends `StopLine`. |
| `src/ui/text.spec.ts` | `moveList` with % for White and for Black. Each row of `evalText`. `accuracyText` for 0 checked and for 7 of 9. `evalBarPercent` for 0, +10000, -10000, a positive value and a negative value. `statusText` for `checkingPosition`. |

### E2E (Cucumber and Playwright)
- Each row of the explorer table gets a % column. The stub gives the move with that number of games and a position total of 100. Thus the % on the screen is fixed.
- Each scenario starts its own line with its color, rating and moves.
- `AppWorld.play` reads the board orientation. For Black, it clicks the squares from the Black side.

Scenarios in `e2e/features/opening-trainer.feature`:
1. The app replies to your first move. The moves are `1. e4 e5 (42%)`. (5 moves.)
2. The app replaces a bad move with the best move. It also checks `Accuracy: 0 of 1 correct (0%)`, that `#eval` shows a pawn value, and that `#evalBarWhite` has a height in %. (5 moves.)
3. The line ends after 5 of your moves. (5 moves.)
4. Lichess does not accept the token. (5 moves.)
5. New: you play Black. The app plays `1. e4 (52%)`. The board shows the Black side. The status is `your move`.
6. New: with 3 moves, the line ends after your third move. The status is `line ended`.

## Documentation
These OKF pages change: `Docs/line.md`, `Docs/engine.md`, `Docs/lichess-explorer.md`, `Docs/trainer.md` and `Docs/trainer-screen.md`. `Docs/index.md` links to this spec. The old spec stays as it is. This spec tells what changes.

## Not included
- A search in the background while you think.
- The Lichess accuracy formula.
- Saved lines, saved settings and statistics after a line.
- A choice of promotion piece.
- A % for your own moves.
