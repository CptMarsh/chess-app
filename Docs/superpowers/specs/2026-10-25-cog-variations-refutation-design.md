---
type: spec
title: Cog, variations and refutation
description: The design of 3 changes to the opening trainer. The settings go behind a cog button. You explore other moves in variations, in a move tree, and you can delete a variation. After a mistake, a variation shows the engine continuation that refutes your move.
tags: [spec, opening, trainer, settings, variations, move-tree, refutation, engine]
---

# Cog, variations and refutation

This spec changes the [Try again, move list, eval number and dark mode](2026-10-24-try-again-move-list-dark-design.md) spec. The parts that this spec does not name stay the same.

## Goal
1. The Rating, Color and Moves settings are behind a cog button.
2. You can explore a line. When a reply surprises you, you go back and play other moves for the two sides. The move list shows these moves as variations, as on Lichess. You can delete a variation.
3. After a mistake, the screen shows the acceptable moves, as now. It also shows the engine continuation that shows why your move is bad. This continuation is a variation, and you can move through it on the board.

Success: you understand each mistake and each surprise in the app. You do not need a different analysis board.

## Decisions
| Subject | Decision |
|---|---|
| Settings | A cog button opens a popover with Rating, Color and Moves. **New line** stays outside the popover. The popover is open when the app starts. |
| Start of a variation | Drop a piece at a position that is not the current position of the line (Lichess style). There is no Explore button. At the current position, you can start a variation only when the line ended. |
| When you can explore | Only when the app waits for no answer: in `your move`, `try again` or `line ended`. This is the rule of **New line**. |
| Variations | A tree. Each new move at a position adds a variation. A variation can have its own variations. |
| Life of a variation | It stays until you delete it or start a new line. When you play the next move of the line, it stays. |
| Delete | The Delete key, or a right-click on a variation move and then **Delete from here**. The move and all the moves after it go away. You cannot delete a move of the line. |
| Eval in a variation | The engine examines each new position. The eval bar shows its eval. The engine shows no arrows in a variation. |
| Refutation | After a mistake, your move becomes a variation. The next 6 moves of the engine continuation (3 for each side) go under it. These positions get the score of your move as their eval. |
| Replies box | Not in this spec. We decide about it later. |

## Facts that we checked (2026-10-25)
- After 1. e4 e5, we did the engine calls of the e2e mistake scenario: MultiPV 3, `ucinewgame`, `go depth 16`, then `go depth 16 searchmoves f1a6`. The last info line of Ba6 is `score cp -624 ... pv f1a6 b8a6 g1f3 d7d5 e4d5 e5e4 f3e5 g8f6 e1g1 ...`. Three runs gave the same line. In SAN, this is `Ba6 Nxa6 Nf3 d5 exd5 e4 Ne5 Nf6 O-O ...`.
- Thus the refutation in the e2e mistake scenario is `(2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)`.
- With `searchmoves` of one move and MultiPV 3, Stockfish gives only `multipv 1`.

## Architecture
The bus stays synchronous, and handlers must not call `send`. The trainer stays the one async unit. Only `src/line/` holds chess rules. `src/ui/` does not use `async` or `await`.

| Unit | Change |
|---|---|
| `src/line/` | The move tree. 3 new commands and 1 new query. The refutation in `JudgeYourMove`. `CurrentLine` gives the tree. |
| `src/engine/` | Each candidate has its `line`. `score` gives a candidate. The engine does one request at a time. |
| `src/trainer/` | `yourLine` in the verdict. The new method `exploreMove(at, move)`. |
| `src/ui/` | The cog. The tree in the move list. The navigation in the tree. Moves at old positions. Delete. |

### Line (`src/line/`)

#### The move tree
- `LineState` holds a tree of nodes. One node is one position. A node has:
  - `id`: a number.
  - `parent`: the id of the position before, or `null` for the start position.
  - `uci` and `san`: the move to this position. They are empty texts for the start position.
  - `fen`: the position.
  - `percent`: the % of a reply of the line, or `null`.
  - `eval`: the eval from the White side, or `null`.
  - `main`: `true` for the positions of the line.
- `LineState` keeps a counter for the ids. `StartLine` makes a new tree, but it does not set the counter back to 0. Thus the ids of a new line are different from the ids of the old line.
- The main nodes are the line: the start position, your moves and the replies. `current` is the id of the last main node.
- The children of a node are in this order: first the main child, then the other children in the order that you played them. The first child of a variation node is the next move of that variation.
- The tree replaces `percents` and `evals`. `chess` stays for the rules of the line. The eval of the line is the eval of the `current` node.
- `PlayYourMove` and `PlayReply` add a main node under `current`, in front of the other children. Then the new node is `current`.

#### Commands
| Command | Result |
|---|---|
| `PlayVariationMove(at, move)` | Adds a node with `main: false` under node `at`, after the other children. `move` is UCI. The `percent` and the `eval` are `null`. If a child of `at` already has this move, nothing changes. If the new position is checkmate, the eval is 10000 when White gives mate and -10000 when Black gives mate. If the new position is stalemate, the eval is 0. Thus the engine gets no position without legal moves. The screen sends only moves from `ExploreMoves(at)`. |
| `JudgeVariationPosition(at, score)` | `score` is from the side to move in node `at`. The line sets the eval of node `at` to this score from the White side. If there is no node `at`, nothing changes. This is the case for a deleted node or a node of an old line. |
| `DeleteVariation(at)` | Removes node `at` and all the nodes under it. If node `at` is a main node, or there is no node `at`, nothing changes. |

#### Query `ExploreMoves(at)`
`ExploreMoves(at)` gives the legal moves at node `at` for the side to move, as `Map<from, to[]>`. A promotion gives its target square one time. The map is empty when:
- the status is `checkingPosition`, `checkingYourMove` or `waitingForReply`;
- `at` is `current`, and the status is `yourMove` or `tryAgain`. There, you play the line;
- there is no node `at`.

Before the first line, the status is `ended`. Thus you can explore from the start position before the first line. `CurrentLine.legalMoves` does not change: it is still empty before the first line.

#### Refutation
`Verdict` gets `yourLine`: the UCI moves of the engine continuation. The first move is your move.

After a bad move, `JudgeYourMove` does all that it does now: the take back, the arrows, the message, the eval and the accuracy. Also:
1. The node of your move stays in the tree, with `main: false`. Thus your move becomes a variation under the current position.
2. The moves of `yourLine` from index 1 to index 6 go under it as nodes, each under the node before. If `yourLine` is shorter, there are fewer nodes.
3. The node of your move and each new node get the eval `yourScore`, from the White side. This is the score of this continuation, so the engine does no more work.

After a good move, the line does not use `yourLine`.

#### Query `CurrentLine`
`LineView` loses `moves` and `startEval`. It gets:
- `nodes`: all the nodes, as `MoveNode` `{ id, parent, uci, san, fen, percent, eval, main }`. A parent comes before its children. The children are in their order.
- `current`: the id of the current position.

`PlayedMove` becomes `MoveNode`. The other fields of `LineView` stay.

### Engine (`src/engine/`)
- `Candidate` is `{ move, score, line }`. `line` is all the UCI moves after `pv` in the last info line of the candidate. The first move of `line` is `move`.
- `analyse(fen)` gives `line` for each candidate.
- `score(fen, move)` gives a `Candidate`, not a number. The `score` and the `line` come from the last info line with a score. If that line has no `pv`, `line` is `[move]`.
- The engine does one request at a time. A call of `analyse` or `score` starts only when the call before it is complete. A call that fails does not stop the next calls. After a worker error, each call fails with `The engine did not start. Reload the page.`, as now.

Each analysis at depth 16 with 3 lines takes approximately 0.6 s. If you drop many moves quickly, the analyses wait in the queue. A line request that comes after them also waits. The engine does not remove old requests from the queue.

### Trainer (`src/trainer/`)
- In the type `Engine`, `score(fen, move)` gives `Promise<Candidate>`.
- `yourMove`: your candidate comes from the kept candidates, or from `engine.score`. The verdict is `{ candidates, yourScore, yourLine }`, with the `score` and the `line` of your candidate.
- `exploreMove(at, move)`:
  1. It sends `PlayVariationMove(at, move)` and calls `show()`.
  2. It finds the child of `at` with this `uci` in `CurrentLine`.
  3. If the eval of that child is `null`, it calls `engine.analyse` with the `fen` of the child. Then it sends `JudgeVariationPosition` with the child id and the score of the first candidate, and calls `show()`.
- `exploreMove` uses `#guarded`, as the other methods. An engine error sends `StopLine` with the error message.
- `exploreMove` does not change the kept candidates of the line.

### Screen (`src/ui/`)

#### Cog
- The top of `#panel` has **New line** and the cog button (`#cog`). The cog is an inline SVG in `currentColor`. It has `aria-label="Settings"`.
- `#settings` has the `popover` attribute. It holds the Rating, Color and Moves fields. The cog has `popovertarget="settings"`, so a click on the cog opens or closes the popover. A click outside the popover, or the Escape key, closes it. The browser does this.
- `mountTrainer` calls `showPopover()`, so the popover is open when the app starts. A click on **New line** is outside the popover, so it closes the popover.
- The popover is under the cog. It is `surface-300`, with a 1-pixel `line-strong` border, the corners `radius-md` and the padding `space-4`. Each field is on its own line. The cog button has the style of the fields.

#### Move list
- The rows of the main line stay as now. Each row has the number, the White move and the Black move.
- The variations of a node P are the children of P after the main child. They show in a `.variations` line after the row of the main child of P. If P has no main child (P is `current`), the line comes after the last row. If there are no rows, it is the first line.
- Each variation is in parentheses. A nested variation shows in the parentheses of its parent variation. It comes after the move that it is an alternative to, as in PGN: `(2. Bc4 Nf6 (2... Nc6 3. d3) 3. d3)`.
- Move numbers in a variation follow PGN. A White move always has its number (`3.`). A Black move has its number with `...` (`2...`) when it is the first move of a variation, or when it comes after a nested variation.
- Each variation move is a `.move` with `data-id`. It holds `.number` (the number, or empty) and `.san`. A variation move has no %. Only the replies of the line have a %.
- The rows use `data-id` in place of `data-index`.
- `.variations` is in `ink-muted`, with an indent of `space-4`. Its text wraps. The viewed move has the class `viewed`, as now.

#### Navigation
- `viewed` is a node id, or `null` for the current position.

| Key | Result |
|---|---|
| ← (`ArrowLeft`) | The parent of the viewed position. At the start position, no change. |
| → (`ArrowRight`) | The first child of the viewed position. Without a child, no change. |
| ↑ (`ArrowUp`) | The start position. |
| ↓ (`ArrowDown`) | The current position (`null`). |

- A click on a move shows the position of that move.
- If the result is `current`, `viewed` is `null`.
- When `current` changes, `viewed` becomes `null`, as now. Thus a reply, a take back or a new line shows the current position.
- When the focus is in an `input` or a `select`, the keys do not navigate, as now.

#### Board
- `at` is `viewed`, or `current` when `viewed` is `null`.
- **Line move.** When `viewed` is `null` and the status is `yourMove` or `tryAgain`, the board works as now. You move your color with `legalMoves`, and a drop calls `trainer.yourMove`.
- **Variation move.** In all other conditions, you move the side to move of the position (field 2 of the FEN), with the moves from `ExploreMoves(at)`. A drop calls `trainer.exploreMove(at, move)`. A pawn on rank 8 or rank 1 becomes a queen, as now.
- The first part of `exploreMove` (the command and `show()`) runs before its first `await`. Thus, when the call gives its promise, the new node is in the tree. Then the screen sets `viewed` to the child of `at` with this move, and calls `show()`.
- The green arrows show only at the current position, as now.

#### Eval bar
`barEval` gets the evals on the path from the start position to the viewed position. The rule does not change: the bar shows the nearest earlier eval that is not `null`.

#### Delete
- The screen sends `DeleteVariation` on the bus. It does not use the trainer, because the engine has no work.
- **Delete key.** When the viewed position is a variation node, the Delete key deletes it. When the focus is in an `input` or a `select`, the key does not delete.
- **Menu.** A right-click on a variation move opens `#moveMenu` at the mouse. The menu has the `popover` attribute and one button: **Delete from here**. A click on the button deletes that move. A right-click on a move of the line opens the normal menu of the browser.
- After a delete, if the viewed position is not in the tree, `viewed` goes to the parent of the deleted node.
- `#moveMenu` has the style of `#settings`.

#### Screen functions
| Function | Result |
|---|---|
| `moveRows(nodes)` (`text.ts`) | The items of the move list, in order. An item is a row `{ number, white, black }` or a variation line `{ tokens }`. A token is `"("`, `")"` or a move `{ id, number, san }`. `white` and `black` are `{ id, san, percent }`. |
| `pathEvals(nodes, id)` (`text.ts`) | The evals from the start position to node `id`. |
| `barEval(evals)` (`text.ts`) | The last value that is not `null` in `evals`, or `null`. |
| `nextView(key, viewed, nodes, current)` (`navigation.ts`) | The next `viewed` for a key, from the table above. |
| `viewOf(id, current)` (`navigation.ts`) | `null` when `id` is `current`. In all other conditions, `id`. |
| `keptView(viewed, shownCurrent, current)` (`navigation.ts`) | `viewed` when `shownCurrent` is `current`. In all other conditions, `null`. |
| `childOf(nodes, at, uci)` (`navigation.ts`) | The id of the child of `at` with this `uci`. |

## Errors
- An engine error during an exploration stops the line with the error message, as other engine errors do.
- Lichess has no part in an exploration. Thus an exploration cannot cause the Lichess limit (status 429).

## Tests
Each spec file has a `*.steps.ts` file, as now. We write each case red, then green, then refactor. The current cases change to the new types. For example, `CurrentLine` gives `nodes` and `current`, not `moves` and `startEval`.

### Unit specs (Vitest)
| Spec | New cases |
|---|---|
| `src/line/line.spec.ts` | Each move of the line is a main node with its `fen`, `percent` and `eval`. `PlayVariationMove` adds a node after the other children. The same move two times adds one node. Checkmate gives ±10000, and stalemate gives 0. `JudgeVariationPosition` sets the eval from the White side, for White and for Black to move. It changes nothing for a deleted node. `DeleteVariation` removes the node and the nodes under it. It changes nothing for a main node. `ExploreMoves` for each status, at `current` and at an old position, and before the first line. A bad move becomes a variation with a maximum of 6 moves of `yourLine` under it. These nodes have the eval `yourScore`. A shorter `yourLine` gives fewer nodes. After a mistake, the acceptable move is the first child. A new line gives new ids. |
| `src/engine/engine.spec.ts` | `analyse` gives `line` for each candidate. `score` gives a candidate with `line`. Without `pv`, `line` is `[move]`. A second call starts only after the first call is complete. A call after a failed call works. |
| `src/trainer/trainer.spec.ts` | The verdict has `yourLine` from a candidate and from `score`. `exploreMove` sends the move, asks the engine and sends the eval. Without a `null` eval, it does not ask the engine. An engine error sends `StopLine`. |
| `src/ui/text.spec.ts` | `moveRows` with no variations (as now), with a variation of a White move, of a Black move and at `current`, with a nested variation, and with a Black move after a nested variation. `pathEvals` and `barEval`. |
| `src/ui/navigation.spec.ts` | `nextView` for each key in a tree: ← at the start, → without a child, → at a branch, a result that is `current`. `childOf`. `keptView`. |

### E2E (Cucumber and Playwright)
- The step `the moves are` reads the rows and the variation lines of `#moveList`, in order. A variation line gives its tokens with spaces, for example `(2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)`. Thus the texts of the current scenarios do not change.
- The steps that use the Rating, Color and Moves fields open the cog first if the popover is closed.
- New steps: `the player right-clicks the move {string}`, `the player clicks {string}`, `the player clicks the cog`, `the settings are open` and `the settings are closed`.

Scenarios in `e2e/features/opening-trainer.feature`:

1. The app replies to your first move. (No change.)
2. Changed: after a mistake, you see the refutation and you play an acceptable move.
   ```
   Given the player starts a line with the rating "1450"
   When the player plays "e2e4 f1a6"
   Then the message is "Ba6 loses 6.4 pawns. Play Nf3, Nc3 or Bc4."
   And the status is "try again"
   And the moves are "1. e4 e5 (42%) (2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)"
   And the accuracy is "0 of 1 correct (0%)"
   When the player clicks the move "Nxa6"
   Then the board has a "black knight" on "a6"
   And the eval bar shows a number
   When the player presses "ArrowDown"
   And the player plays "g1f3"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Ba6 Nxa6 3. Nf3 d5 4. exd5 e4 5. Ne5)"
   And the eval bar has a height
   And the eval bar shows a number
   ```
3. to 7. No change.
8. New: you explore from an old position.
   ```
   Given the player starts a line with the rating "1450"
   When the player plays "e2e4 g1f3"
   And the player presses "ArrowLeft"
   And the player presses "ArrowLeft"
   Then the highlighted move is "e5"
   When the player plays "f1c4 g8f6"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4 Nf6)"
   And the highlighted move is "Nf6"
   And the eval bar shows a number
   And the status is "your move"
   When the player presses "ArrowLeft"
   And the player plays "b8c6"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4 Nf6 (2... Nc6))"
   When the player presses "ArrowDown"
   And the player plays "f1b5"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4 Nf6 (2... Nc6)) 3. Bb5 a6 (55%)"
   ```
9. New: you delete a variation.
   ```
   Given the player starts a line with the rating "1450"
   When the player plays "e2e4 g1f3"
   And the player presses "ArrowLeft"
   And the player presses "ArrowLeft"
   And the player plays "f1c4 g8f6"
   When the player right-clicks the move "Nf6"
   And the player clicks "Delete from here"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%) (2. Bc4)"
   And the highlighted move is "Bc4"
   When the player presses "Delete"
   Then the moves are "1. e4 e5 (42%) 2. Nf3 Nc6 (61%)"
   And the highlighted move is "e5"
   ```
10. New: the settings are behind the cog.
    ```
    Then the settings are open
    Given the player starts a line with the rating "1450"
    Then the settings are closed
    When the player clicks the cog
    Then the settings are open
    When the player presses "Escape"
    Then the settings are closed
    ```

## Documentation
These OKF pages change: `Docs/line.md`, `Docs/engine.md`, `Docs/trainer.md` and `Docs/trainer-screen.md`. `Docs/index.md` links to this spec. The older specs stay as they are. This spec tells what changes.

## Not included
- The Lichess replies box at a position. We decide about it later.
- Engine arrows in a variation.
- The removal of old requests from the engine queue.
- A % for a variation move.
- A move from a variation to the line (promote).
- A save of the variations after a new line.
