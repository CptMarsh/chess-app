---
type: component
title: Line
description: The rules of one opening line. The line has the commands and the query on the command and query bus.
resource: src/line/line.ts
tags: [line, chess, rules, move-tree, variations, refutation]
---

# Line

`attachLine(bus, random)` attaches the handlers of the line to a `LineBus`. All handlers get the same `LineState` object in their constructors. This object holds the state of the current line. Only `src/line/` holds chess rules.

Before the first `StartLine`, the board shows the start position, your color is White, and the status is `ended`. The tree has only the start position, so you can explore from it (see `ExploreMoves`).

`Color` is `"white"` or `"black"`. It is your color.

## Commands

| Command | Result |
|---|---|
| `StartLine(rating, color, moves)` | Starts a new line at the start position, with a new tree (see "The move tree"). The line keeps `color` and the length of the line (`moves`). Status: `checkingPosition` for White. Status: `waitingForReply` for Black, because White moves first. The message is empty, there are no arrows and no acceptable moves, the eval of the start position is `null`, and the accuracy is 0 of 0. If the rating is not a whole number of 0 or more, it throws `The rating must be a whole number, 0 or more.` and the state does not change. The line does not keep the rating. It checks the rating first. Then, if `moves` is not a whole number of 2 or more, it throws `The number of moves must be a whole number, 2 or more.` and the state does not change. |
| `JudgePosition(score)` | Sets the eval to `score`, changed to the White side (see "Scores"). Status: `yourMove`. The engine examined the position before your move. |
| `PlayYourMove(move)` | Plays your move (UCI, for example `e2e4`). It clears the message and the arrows, and adds a main node with the `percent` `null` and the eval `null` for your move. When the status is `tryAgain`, see "Your second move". In all other statuses, the status is `waitingForReply` for your first move and `checkingYourMove` for each other move. |
| `JudgeYourMove(verdict)` | Judges your last move. See "Judging your move". It also sets the eval and the accuracy. Status: `waitingForReply`, `tryAgain` or `ended`. |
| `PlayReply(replies)` | Picks one reply and plays it. It adds a main node with the eval `null` and the `percent` of the picked reply. Status: `checkingPosition`. The message stays. Your next move clears it. If `replies` is empty, the line ends with `No games at your level after this position.` |
| `StopLine(message)` | Ends the line with the message. Status: `ended`. |
| `PlayVariationMove(at, move)` | Adds a node with `main: false` under node `at`, after the other children. `move` is UCI. The `percent` and the eval are `null`. If a child of `at` already has this move, nothing changes. If there is no node `at`, nothing changes. If the new position is checkmate, the eval is 10000 when White gives mate and -10000 when Black gives mate. If the new position is stalemate, the eval is 0. A checkmate or a stalemate also gets `lines: []`. Thus the engine gets no position without legal moves. The screen sends only moves from `ExploreMoves(at)`. |
| `JudgeVariationPosition(at, score)` | `score` is from the side to move in node `at`. Sets the eval of node `at` to this score from the White side. If there is no node `at` (a deleted node, or a node of an old line), nothing changes. |
| `KeepEngineLines(at, candidates)` | Sets the `lines` of node `at` from the engine candidates. Each candidate gives one `EngineLine`: its `score` changed to the White side (from the side to move in node `at`), and its `line` played from the FEN of node `at` and turned into SAN. `[]` gives `[]`. If there is no node `at`, nothing changes. It does not change the eval. |
| `DeleteVariation(at)` | Removes node `at` and all the nodes under it. If node `at` is a main node, or there is no node `at`, nothing changes. |

## How the reply is picked

Each reply has `uci`, `san`, `games` and `percent`. The handler multiplies the random number by the total of the `games`. It picks the first reply where the running total of the `games` is more than that product. For example, with 30 and 10 games, the random number 0.74 picks the first reply (0.74 × 40 = 29.6) and 0.76 picks the second (0.76 × 40 = 30.4). The default random function is `Math.random`.

## Judging your move

A verdict has `candidates`, `yourScore` and `yourLine`. `candidates` has 1 to 3 `Candidate` items (`{ move, score, line }`, `move` in UCI), best first. `yourLine` is the engine continuation of your move, in UCI. Its first move is your move. `bestMove` is the move of the first candidate, and `bestScore` is its score. The scores are in centipawns from your side. A mate for you is +10000. A mate for your opponent is -10000. The loss is `bestScore - yourScore`. The line changes a score to the White side with one method of `LineState`. For White, the score stays. For Black, the sign changes.

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

1. It takes back your move, and it subtracts 1 from `yourMoves`. The node of your move stays in the tree with `main: false`, after the other children of the current position. Thus your move becomes a variation. The current position is the position before your move.
2. The refutation: the moves of `yourLine` from index 1 to index 6 go under the node of your move, each under the node before. If `yourLine` is shorter, there are fewer nodes. The node of your move and each new node get the eval `yourScore`, from the White side. The engine does no more work for them.
3. It keeps the acceptable moves (`LineState.acceptable`).
4. It sets one arrow for each acceptable move.
5. It sets the eval from `bestScore`, changed to the White side.
6. It sets the status to `tryAgain`. The end rules do not apply.

The handler finds the refutation moves before it changes the state. Thus, when a move of `yourLine` is not legal, the handler throws, and the state does not change. After a good move, the line does not use `yourLine`.

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

## The move tree

`LineState` holds a tree of nodes. One node is one position. A node (`MoveNode`) has:

- `id`: a number.
- `parent`: the id of the position before, or `null` for the start position.
- `uci` and `san`: the move to this position (`lan` and `san` of `chess.js`). They are empty texts for the start position.
- `fen`: the position.
- `percent`: the % of a reply of the line, or `null`. Your moves and variation moves have `null`.
- `eval`: the eval from the White side, or `null`.
- `lines`: the engine lines of the position, or `null` when the engine did not examine it. An `EngineLine` is `{ eval, sans }`: the eval from the White side and the moves in SAN. A maximum of 3 lines, best first. `[]` for a position without legal moves. Each new node gets `null`, except a checkmate or a stalemate in a variation. See [Engine lines in explore mode](superpowers/specs/2026-10-25-engine-lines-design.md).
- `main`: `true` for the positions of the line.

The main nodes are the line: the start position, your moves and the replies. `current` is the id of the last main node. `chess` stays for the rules of the line, and its position is the position of `current`. In this page, "the eval" is the eval of the `current` node. Each rule that sets the eval sets this node. The eval of your first move stays `null`, because the line does not judge your first move. For Black, the eval of the start position stays `null`, because the engine does not examine the start position.

The children of a node are in this order: first the main child, then the other children in the order that you played them. `PlayYourMove` and `PlayReply` add a main node under `current`, in front of the other children. Then the new node is `current`. The first child of a variation node is the next move of that variation.

`LineState` keeps a counter for the ids. `StartLine` makes a new tree, but it does not set the counter back to 0. Thus the ids of a new line are different from the ids of the old line, and a late `JudgeVariationPosition` for an old node changes nothing.

A variation stays until you delete it or start a new line. When the line goes on, it stays.

## Ending a line

When a line ends, the status is `ended`. The end text joins the current message with one space. If one of them is empty, the other one stays as it is.

## Queries

| Query | Answer |
|---|---|
| `CurrentLine` | The FEN of the current position, your color (`color`), the tree (`nodes`, all the `MoveNode` items; a parent comes before its children, and the children are in their order), the id of the current position (`current`), the status, the message, the arrows (`arrows`, one for each acceptable move, or empty), the eval (`eval`, in centipawns from the White side, or `null`), the accuracy (`accuracy`, as `{ correct, checked }`), and the legal moves. |
| `ExploreMoves(at)` | The legal moves at node `at` for the side to move, as a map from a square to its target squares. A promotion gives its target square one time. See below for when the map is empty. |

The legal moves of `CurrentLine` are the moves of the line. When the status is `yourMove`, the map has all legal moves. When the status is `tryAgain`, it has only the acceptable moves. In all other statuses the map is empty. It is empty before the first line, too.

The map of `ExploreMoves(at)` is empty when:
- the status is `checkingPosition`, `checkingYourMove` or `waitingForReply`;
- `at` is `current`, and the status is `yourMove` or `tryAgain`. There, you play the line;
- there is no node `at`.

Thus you can explore at an old position in `yourMove`, `tryAgain` and `ended`, and at the current position only when the line ended.

## Status values
- `yourMove`: you can move.
- `tryAgain`: you made a mistake. You must play one of the acceptable moves.
- `checkingPosition`: the engine examines the position before your move.
- `checkingYourMove`: your move waits for a judgement.
- `waitingForReply`: the reply of the opponent is not played yet.
- `ended`: the line is over, or there is no line.
