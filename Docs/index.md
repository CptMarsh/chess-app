---
type: index
title: Chess app
description: The start of the documentation of the chess app.
---

# Chess app

The chess app helps a person become better at chess. It runs only in the browser.

## Concepts
- [Command and query bus](command-query-bus.md): the router that sends each command and each query to its handler.
- [Line](line.md): the rules of one opening line, as commands and a query on the bus.
- [Lichess explorer](lichess-explorer.md): the adapter that gets the most common replies of a position from Lichess.
- [Stockfish engine](engine.md): the adapter that judges a move with Stockfish in a Web Worker.
- [Trainer](trainer.md): the one async unit. It waits for the engine and the explorer, then sends a command with the result.
- [Trainer screen](trainer-screen.md): the screen that shows the rating field, the board, the moves, the message and the status.

## Specs
- [Opening trainer](superpowers/specs/2026-10-23-opening-trainer-design.md): the design of the opening trainer.

## Process
We use spec-driven development with a red-green-refactor loop. The unit specs are in `src/**/*.spec.ts` (Vitest). The e2e scenarios are in `e2e/features/` (Cucumber.js and Playwright).
