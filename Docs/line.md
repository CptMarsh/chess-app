---
type: component
title: Line
description: The rules of one opening line. The line has the commands and the query on the command and query bus.
resource: src/line/line.ts
tags: [line, chess, rules]
---

# Line

`attachLine(bus, random)` attaches the handlers of the line to a `LineBus`. All handlers get the same `LineState` object in their constructors. This object holds the state of the current line. Only `src/line/` holds chess rules.

Before the first `StartLine`, the board shows the start position, your color is White, and the status is `ended`.

`Color` is `"white"` or `"black"`. It is your color.

## Commands

| Command | Result |
|---|---|
| `StartLine(rating, color, moves)` | Starts a new line at the start position. The line keeps `color` and the length of the line (`moves`). Status: `checkingPosition` for White. Status: `waitingForReply` for Black, because White moves first. The message is empty, there is no arrow, the eval is `null`, and the accuracy is 0 of 0. If the rating is not a whole number of 0 or more, it throws `The rating must be a whole number, 0 or more.` and the state does not change. The line does not keep the rating. It checks the rating first. Then, if `moves` is not a whole number of 2 or more, it throws `The number of moves must be a whole number, 2 or more.` and the state does not change. |
| `JudgePosition(score)` | Sets the eval to `score`, changed to the White side (see "Scores"). Status: `yourMove`. The engine examined the position before your move. |
| `PlayYourMove(move)` | Plays your move (UCI, for example `e2e4`). It clears the message and the arrow, sets the eval to `null`, and adds the `percent` `null` for your move. Status: `waitingForReply` for your first move. Status: `checkingYourMove` for each other move. |
| `JudgeYourMove(verdict)` | Judges your last move. See "Judging your move". It also sets the eval and the accuracy. Status: `waitingForReply`, or `ended`. |
| `PlayReply(replies)` | Picks one reply and plays it. It sets the eval to `null`. It keeps the `percent` of the picked reply. Status: `checkingPosition`. The message and the arrow stay. Your next move clears them. If `replies` is empty, the line ends with `No games at your level after this position.` |
| `StopLine(message)` | Ends the line with the message. Status: `ended`. |

## How the reply is picked

Each reply has `uci`, `san`, `games` and `percent`. The handler multiplies the random number by the total of the `games`. It picks the first reply where the running total of the `games` is more than that product. For example, with 30 and 10 games, the random number 0.74 picks the first reply (0.74 × 40 = 29.6) and 0.76 picks the second (0.76 × 40 = 30.4). The default random function is `Math.random`.

## Judging your move

A verdict has `bestMove` (UCI), `bestScore` and `yourScore`. The scores are in centipawns from your side. A mate for you is +10000. A mate for your opponent is -10000. The loss is `bestScore - yourScore`. The line changes a score to the White side with one method of `LineState`. For White, the score stays. For Black, the sign changes.

The handler compares your move with `bestMove` as UCI (`lan`), not as SAN. For example, castling is `e1g1` and a promotion is `b7a8q`.

| Condition | Message | Board |
|---|---|---|
| Your move is `bestMove`. | `Best move.` | Your move stays. |
| The loss is 20 or less. | `Good. The best move was Nf3.` | Your move stays. |
| The loss is more than 20, and `yourScore` is -10000. | `g4 allows mate. The best move is e4.` | The best move replaces your move. The arrow shows it. |
| The loss is more than 20, and `bestScore` is +10000. | `Bc4 misses a mate. The best move is Qxf7#.` | The best move replaces your move. The arrow shows it. |
| The loss is more than 20 in all other conditions. | `Bc4 loses 0.8 pawns. The best move is Nf3.` | The best move replaces your move. The arrow shows it. |

The pawn value is the loss divided by 100, with one decimal. The SAN of the best move comes from the position before your move.

The handler also sets the eval, from the White side. If your move stays, the eval is `yourScore`. If the best move replaces your move, the eval is `bestScore`. For Black, the sign of the number changes. For example, `yourScore` 25 gives the eval -25.

After the judgement, if the move on the board gives checkmate, the line ends and the message gets `Checkmate.` at its end. If not, the line ends after the judgement of your last move (move number `moves`). The line keeps the length in `LineState.lineLength`. In all other conditions the status is `waitingForReply`.

## Scores

The scores in `JudgePosition` and `JudgeYourMove` are from your side. The eval in `CurrentLine` is from the White side. For White, the two are equal. For Black, the eval is the score with the other sign. For example, if the engine gives 40 for Black, the eval is -40.

## Accuracy

The line keeps the accuracy: `correct` and `checked`. `StartLine` sets both to 0. Each `JudgeYourMove` adds 1 to `checked`. It adds 1 to `correct` when your move is `bestMove`, or when the loss is 20 or less. Your first move is not judged, so it is not in the accuracy.

## The % of each move

The line keeps a list of the % of each move (`percents`) next to the `chess.js` history. `StartLine` empties the list. `PlayYourMove` adds `null`. `PlayReply` adds the `percent` of the picked reply. When the best move replaces your move, the number of moves does not change, so the list stays correct.

## Ending a line

When a line ends, the status is `ended`. The end text joins the current message with one space. If one of them is empty, the other one stays as it is.

## Query

| Query | Answer |
|---|---|
| `CurrentLine` | The FEN, your color (`color`), the moves (`moves`, as `{ san, percent }` objects; `percent` is `null` for your moves), the status, the message, the arrow of the best move (or none), the eval (`eval`, in centipawns from the White side, or `null`), the accuracy (`accuracy`, as `{ correct, checked }`), and the legal moves. |

The legal moves are a map from a square to its target squares. The map has entries only when the status is `yourMove`. In all other statuses the map is empty, and the board is locked.

## Status values
- `yourMove`: you can move.
- `checkingPosition`: the engine examines the position before your move.
- `checkingYourMove`: your move waits for a judgement.
- `waitingForReply`: the reply of the opponent is not played yet.
- `ended`: the line is over, or there is no line.
