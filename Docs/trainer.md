---
type: component
title: Trainer
description: The one async unit. It waits for the engine and the explorer, then sends a command with the result.
resource: src/trainer/trainer.ts
tags: [trainer, async]
---

# Trainer

The trainer does the async steps of a line in the correct order. It holds no chess rules. It reads the status from the `CurrentLine` query. Only `src/trainer/` uses `await`.

`new Trainer(bus, engine, explorer, show)` gets a `LineBus`, an engine, an explorer and a `show` function. The engine is `StockfishEngine` (`analyse` and `score`). The explorer is `LichessExplorer`. The trainer calls `show()` after each command.

## Methods

| Method | Result |
|---|---|
| `start(rating, color, moves)` | It gives a promise. It sends `StartLine(rating, color, moves)`. It keeps the rating for the explorer. Then it calls `show()` and does the prepare steps. For Black, the status is `waitingForReply`, so the prepare steps first ask the explorer for the first White move. If `StartLine` throws an error, the promise rejects with that error, and the trainer does no more steps. |
| `yourMove(move)` | Does the steps below. |

## Steps of `yourMove`

1. Ask `CurrentLine` for the FEN before your move.
2. Send `PlayYourMove(move)`. Then call `show()`.
3. If the status is `checkingYourMove`: if `move` is the `move` of one of the kept candidates, `yourScore` is the score of that candidate. If not, get `yourScore` from `engine.score(fenBefore, move)`. Then send `JudgeYourMove({ candidates, yourScore })` with the kept candidates.
4. If the status is not `ended`: do the prepare steps.

Your first move gets no judgement, also for Black. The explorer and the engine are not asked after the line ends.

### A mistake
A mistake needs no special step in the trainer:

1. After `JudgeYourMove`, the status is `tryAgain`. The prepare steps do nothing, so the trainer stops.
2. Your second move calls `yourMove` again. `PlayYourMove` sets the status to `waitingForReply` or `ended`. Thus there is no judgement, and the prepare steps get the reply.

## The prepare steps

`start` and `yourMove` use the same steps:

1. If the status is `waitingForReply`: get the replies from the explorer for the FEN of the line now. Then send `PlayReply(replies)`.
2. If the status is `checkingPosition`: get the candidates from `engine.analyse(fen)` for the FEN of the line now. Then send `JudgePosition(candidates[0].score)`.

The trainer keeps the candidates (a maximum of 3). It uses them for the judgement of your next move. Thus a move that is one of the candidates needs no `score` call.

## Errors

If the engine or the explorer throws an error after `StartLine`, the trainer sends `StopLine(error.message)` and calls `show()`. Then it stops.

One `try` covers all steps after `StartLine` (in `start`) and after `PlayYourMove` (in `yourMove`). It also catches a throw from a handler (`JudgePosition`, `JudgeYourMove` or `PlayReply`) and from each `show()`, also the first one. The line then ends with the message of that error, and the screen does not freeze.
