---
type: component
title: Line
description: The rules of one opening line. The line has the commands and the query on the command and query bus.
resource: src/line/line.ts
tags: [line, chess, rules]
---

# Line

`attachLine(bus, random)` attaches the handlers of the line to a `LineBus`. All handlers get the same `LineState` object in their constructors. This object holds the state of the current line. Only `src/line/` holds chess rules.

Before the first `StartLine`, the board shows the start position and the status is `ended`.

## Commands

| Command | Result |
|---|---|
| `StartLine(rating)` | Starts a new line at the start position. Status: `yourMove`. The message is empty and there is no arrow. If the rating is not a whole number of 0 or more, it throws `The rating must be a whole number, 0 or more.` and the state does not change. The line does not keep the rating. |
| `PlayYourMove(move)` | Plays your move (UCI, for example `e2e4`). It clears the message and the arrow. Status: `waitingForReply` for your first move. Status: `checkingYourMove` for each other move. |

## Query

| Query | Answer |
|---|---|
| `CurrentLine` | The FEN, the moves in SAN, the status, the message, the arrow of the best move (or none), and the legal moves. |

The legal moves are a map from a square to its target squares. The map has entries only when the status is `yourMove`. In all other statuses the map is empty, and the board is locked.

## Status values
- `yourMove`: you can move.
- `checkingYourMove`: your move waits for a judgement.
- `waitingForReply`: the reply of the opponent is not played yet.
- `ended`: the line is over, or there is no line.
