---
type: component
title: Trainer
description: The one async unit. It waits for the engine and the explorer, then sends a command with the result.
resource: src/trainer/trainer.ts
tags: [trainer, async]
---

# Trainer

The trainer does the async steps of a line in the correct order. It holds no chess rules. It reads the status from the `CurrentLine` query. Only `src/trainer/` uses `await`.

`new Trainer(bus, engine, explorer, show)` gets a `LineBus`, an engine, an explorer and a `show` function. The engine is `StockfishEngine`. The explorer is `LichessExplorer`. The trainer calls `show()` after each command.

## Methods

| Method | Result |
|---|---|
| `start(rating)` | Sends `StartLine(rating)`. Then it calls `show()`. It keeps the rating for the explorer. If `StartLine` throws an error, the error goes to the caller. |
| `yourMove(move)` | Does the steps below. |

## Steps of `yourMove`

1. Ask `CurrentLine` for the FEN before your move.
2. Send `PlayYourMove(move)`.
3. If the status is `checkingYourMove`: get the verdict from the engine for the FEN before your move. Then send `JudgeYourMove(verdict)`.
4. If the status is not `ended`: get the replies from the explorer for the FEN of the line now. Then send `PlayReply(replies)`.

Your first move gets no judgement. The explorer is not asked after the line ends.

## Errors

If the engine or the explorer throws an error, the trainer sends `StopLine(error.message)` and calls `show()`. Then it stops.
