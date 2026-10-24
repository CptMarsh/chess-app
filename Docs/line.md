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
| `StartLine(rating, color, moves)` | Starts a new line at the start position. The line keeps `color` and the length of the line (`moves`). Status: `checkingPosition` for White. Status: `waitingForReply` for Black, because White moves first. The message is empty, there are no arrows and no acceptable moves, the eval of the start position is `null`, and the accuracy is 0 of 0. If the rating is not a whole number of 0 or more, it throws `The rating must be a whole number, 0 or more.` and the state does not change. The line does not keep the rating. It checks the rating first. Then, if `moves` is not a whole number of 2 or more, it throws `The number of moves must be a whole number, 2 or more.` and the state does not change. |
| `JudgePosition(score)` | Sets the eval to `score`, changed to the White side (see "Scores"). Status: `yourMove`. The engine examined the position before your move. |
| `PlayYourMove(move)` | Plays your move (UCI, for example `e2e4`). It clears the message and the arrows, and adds the `percent` `null` and the eval `null` for your move. When the status is `tryAgain`, see "Your second move". In all other statuses, the status is `waitingForReply` for your first move and `checkingYourMove` for each other move. |
| `JudgeYourMove(verdict)` | Judges your last move. See "Judging your move". It also sets the eval and the accuracy. Status: `waitingForReply`, `tryAgain` or `ended`. |
| `PlayReply(replies)` | Picks one reply and plays it. It adds the eval `null` for the reply. It keeps the `percent` of the picked reply. Status: `checkingPosition`. The message stays. Your next move clears it. If `replies` is empty, the line ends with `No games at your level after this position.` |
| `StopLine(message)` | Ends the line with the message. Status: `ended`. |

## How the reply is picked

Each reply has `uci`, `san`, `games` and `percent`. The handler multiplies the random number by the total of the `games`. It picks the first reply where the running total of the `games` is more than that product. For example, with 30 and 10 games, the random number 0.74 picks the first reply (0.74 × 40 = 29.6) and 0.76 picks the second (0.76 × 40 = 30.4). The default random function is `Math.random`.

## Judging your move

A verdict has `candidates` and `yourScore`. `candidates` has 1 to 3 `Candidate` items (`{ move, score }`, `move` in UCI), best first. `bestMove` is the move of the first candidate, and `bestScore` is its score. The scores are in centipawns from your side. A mate for you is +10000. A mate for your opponent is -10000. The loss is `bestScore - yourScore`. The line changes a score to the White side with one method of `LineState`. For White, the score stays. For Black, the sign changes.

The handler compares your move with `bestMove` as UCI (`lan`), not as SAN. For example, castling is `e1g1` and a promotion is `b7a8q`.

An acceptable move is a candidate with `bestScore - score` of 20 or less. The first candidate is always acceptable. Thus there are 1, 2 or 3 acceptable moves.

| Condition | Message | Board |
|---|---|---|
| Your move is `bestMove`. | `Best move.` | Your move stays. |
| The loss is 20 or less. | `Good. The best move was Nf3.` | Your move stays. |
| The loss is more than 20, and `yourScore` is -10000. | `g4 allows mate. Play e4.` | The line takes back your move. |
| The loss is more than 20, and `bestScore` is +10000. | `Bc4 misses a mate. Play Qxf7#.` | The line takes back your move. |
| The loss is more than 20 in all other conditions. | `Bc4 loses 0.8 pawns. Play Nf3, Bb5 or d4.` | The line takes back your move. |

The pawn value is the loss divided by 100, with one decimal. The SAN of each move comes from the position before your move. The list after `Play` has the acceptable moves in the order of the candidates: `Play Nf3.`, `Play Nf3 or Bb5.` or `Play Nf3, Bb5 or d4.`

The handler finds the SAN of the best move and of each acceptable move before it changes the state. Thus, when one of these moves is not legal, the handler throws an error, and the state does not change. A candidate that is not acceptable gets no SAN, so it does not throw.

When your move stays, the eval is `yourScore`, from the White side. Then the end rules apply.

### A mistake
When the loss is more than 20, the handler does these steps:

1. It takes back your move. It removes the last item of the % list, and it subtracts 1 from `yourMoves`.
2. It keeps the acceptable moves (`LineState.acceptable`).
3. It sets one arrow for each acceptable move.
4. It sets the eval from `bestScore`, changed to the White side.
5. It sets the status to `tryAgain`. The end rules do not apply.

### Your second move
When the status is `tryAgain`, `PlayYourMove(move)` finds the acceptable move with the same 2 squares as `move` (the first 4 characters of the UCI). It plays that acceptable move, also with its promotion piece. For example, the screen sends `b7a8q`, and the acceptable move `b7a8n` plays `bxa8=N`. It finds the move before it changes the state. The eval is the score of that acceptable move, changed to the White side. The line clears the acceptable moves. Then the end rules apply. The move gets no judgement, and the accuracy does not change. The board lets you play only the acceptable moves, so the line does not check the move again.

### End rules
`LineState.afterYourMove()` holds the end rules. `JudgeYourMove` and your second move use it:

- If the move on the board gives checkmate, the line ends and the message gets `Checkmate.` at its end.
- If not, the line ends after your last move (move number `moves`). The line keeps the length in `LineState.lineLength`.
- In all other conditions the status is `waitingForReply`.

## Scores

The scores in `JudgePosition` and `JudgeYourMove` are from your side. The eval in `CurrentLine` is from the White side. For White, the two are equal. For Black, the eval is the score with the other sign. For example, if the engine gives 40 for Black, the eval is -40.

## Accuracy

The line keeps the accuracy: `correct` and `checked`. `StartLine` sets both to 0. Each `JudgeYourMove` adds 1 to `checked`. It adds 1 to `correct` when your move is `bestMove`, or when the loss is 20 or less. A mistake is not correct. Your second move after a mistake is not in the accuracy. Your first move is not judged, so it is not in the accuracy.

## The % of each move

The line keeps a list of the % of each move (`percents`) next to the `chess.js` history. `StartLine` empties the list. `PlayYourMove` adds `null`. `PlayReply` adds the `percent` of the picked reply. When the line takes back your move after a mistake, it also removes the last item of the list, so the list stays correct.

## The eval of each position

The line keeps a list of evals (`evals`), one for each position: the start position and the position after each move. `StartLine` sets the list to `[null]`. `PlayYourMove` and `PlayReply` add `null`. When the line takes back your move after a mistake, it also removes the last item of the list. In this page, "the eval" is the last item of the list: the eval of the current position. Each rule that sets the eval sets this item. The eval of your first move stays `null`, because the line does not judge your first move. For Black, the eval of the start position stays `null`, because the engine does not examine the start position.

## Ending a line

When a line ends, the status is `ended`. The end text joins the current message with one space. If one of them is empty, the other one stays as it is.

## Query

| Query | Answer |
|---|---|
| `CurrentLine` | The FEN, your color (`color`), the moves (`moves`, as `{ san, percent, fen, eval }` objects; `percent` is `null` for your moves; `fen` is the position after the move, from `after` of the `chess.js` history; `eval` is the eval of the position after the move, or `null`), the status, the message, the arrows (`arrows`, one for each acceptable move, or empty), the eval (`eval`, in centipawns from the White side, or `null`), the eval of the start position (`startEval`, or `null`), the accuracy (`accuracy`, as `{ correct, checked }`), and the legal moves. |

The legal moves are a map from a square to its target squares. When the status is `yourMove`, the map has all legal moves. When the status is `tryAgain`, it has only the acceptable moves. In all other statuses the map is empty, and the board is locked.

## Status values
- `yourMove`: you can move.
- `tryAgain`: you made a mistake. You must play one of the acceptable moves.
- `checkingPosition`: the engine examines the position before your move.
- `checkingYourMove`: your move waits for a judgement.
- `waitingForReply`: the reply of the opponent is not played yet.
- `ended`: the line is over, or there is no line.
