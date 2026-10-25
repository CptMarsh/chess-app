---
type: spec
title: Engine lines in explore mode
description: The design of the engine lines. In explore mode, the panel shows the 3 best Stockfish lines of the position on the board, each with its eval and its moves.
tags: [spec, engine, ui, variations]
---

# Engine lines in explore mode

This spec changes the [Cog, variations and refutation](2026-10-25-cog-variations-refutation-design.md) spec and the [Mobile view](2026-10-25-mobile-view-design.md) spec. The parts that this spec does not name stay the same.

## Goal
In explore mode, you see the 3 best engine lines of the position on the board. Thus you learn why a move is good or bad.

Success: you go back to an old position. The panel shows 3 lines, for example `+0.3 2. Nf3 Nc6 3. Bb5 a6`. You go back to the current position, and the lines go away, because they would show the answer.

## Decisions
| Subject | Decision |
|---|---|
| Explore mode | The board is in explore mode when a drop is a variation move (see the trainer screen), and the status is `yourMove`, `tryAgain` or `ended`. These are the statuses in which you can explore. At the current position in `yourMove` or `tryAgain`, the board is not in explore mode. |
| Where the lines come from | `engine.analyse(fen)` already gives a maximum of 3 candidates (MultiPV 3), each with its continuation. No new engine call. |
| Where the lines are kept | Each `MoveNode` gets `lines: EngineLine[] \| null`. An `EngineLine` is `{ eval, sans }`: the eval from the White side, and the moves of the continuation in SAN. `null` means that the engine did not examine the position. `[]` means that the position has no legal moves. |
| New command | `KeepEngineLines(at, candidates)`. The line turns the UCI moves into SAN from the FEN of node `at`. A missing node changes nothing. |
| When the trainer sends it | After each analysis: in the prepare steps (for the current node), in `exploreMove` (for the new node), and in the new method `examine(at)`. |
| `examine(at)` | The screen calls it in explore mode when node `at` has no lines. It asks `engine.analyse` for the FEN of node `at`. The trainer asks for each node one time only, also when the screen calls it many times. It does not change the eval of the node. |
| A checkmate or a stalemate in a variation | `PlayVariationMove` gives the node `lines: []`, so the engine has no work. |
| How a line looks | `.engineLine`: the eval (`.score`) and the moves (`.moves`) with PGN move numbers. The eval has a sign: `+0.3`, `-1.2`, `0.0`, `+M` or `-M`. A line that is too long ends in `…`, on one line. |
| Text while the engine works | `The engine is thinking.` |
| Text without legal moves | `No moves.` |
| Errors | As in an exploration: an engine error stops the line with its message. |

## Architecture
- `src/line/`: `EngineLine`, `MoveNode.lines`, `KeepEngineLines` and its handler.
- `src/trainer/`: `KeepEngineLines` after each analysis, and `examine(at)`.
- `src/ui/`: `#engineLines` under `#navigation`, and the text functions `lineScore` and `lineMoves`.

## Tests
- Unit: the handler keeps the lines from the White side in SAN; a missing node changes nothing; a new node has no lines; a mate in a variation has `[]`. The trainer keeps the lines after each analysis; `examine` asks the engine one time for a node; `examine` of a node with lines does not ask. The text functions.
- e2e: after `e4 e5`, you go back to `e4`. The panel shows 3 engine lines. You go to the current position, and the lines go away.
