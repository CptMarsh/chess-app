---
type: index
title: Chess app
description: The start of the documentation of the chess app.
---

# Chess app

The chess app helps a person become better at chess. It runs only in the browser.

## Concepts
- [Command and query bus](command-query-bus.md): the router that sends each command and each query to its handler.
- [Line](line.md): the rules of one opening line and its move tree with variations, as commands and queries on the bus.
- [Lichess explorer](lichess-explorer.md): the adapter that gets the most common replies of a position from Lichess.
- [chess.com explorer and source explorer](chess-com-explorer.md): the adapter that gets the replies of a position from your own chess.com games, and the adapter that sends each request to the explorer of the chosen source.
- [Settings store](settings.md): the adapter that keeps the source of the replies and your chess.com username in the browser.
- [Token store and token dialog](token.md): the adapter that keeps your Lichess token in the browser, and the dialog that asks you for it.
- [Stockfish engine](engine.md): the adapter that examines a position and scores a move with Stockfish in a Web Worker, one request at a time.
- [Trainer](trainer.md): the one async unit. It waits for the engine and the explorer, then sends a command with the result.
- [Deployment](deployment.md): the build, the base path `/chess-app/` and the workflow that publishes the app on GitHub Pages.
- [Trainer screen](trainer-screen.md): the screen that shows New line and the cog with the rating, color, moves, source and username fields, the board, the eval bar with the eval number, the move list with its variations, the message, the accuracy, the status and the Change token button. It is dark, in the Darkwood style.

## Specs
- [Opening trainer](superpowers/specs/2026-10-23-opening-trainer-design.md): the design of the opening trainer.
- [Eval, accuracy, line length and Black](superpowers/specs/2026-10-24-eval-accuracy-length-black-design.md): the % of each opponent move, the eval and the eval bar, your accuracy, the line length, and Black as your color.
- [Try again, move list, eval number and dark mode](superpowers/specs/2026-10-24-try-again-move-list-dark-design.md): a maximum of 3 acceptable moves after a mistake, the move list at the side of the board with the arrow keys, the number on the eval bar, and dark mode.
- [Cog, variations and refutation](superpowers/specs/2026-10-25-cog-variations-refutation-design.md): the settings behind a cog button, variations in a move tree with delete, and the engine continuation that refutes a bad move.
- [Ask for the Lichess token](superpowers/specs/2026-10-25-lichess-token-design.md): the token dialog. The app keeps the token in the browser, so the build holds no token.
- [Publish on GitHub Pages](superpowers/specs/2026-10-25-github-pages-design.md): each push to `trunk` tests, builds and publishes the app.
- [Reply source](superpowers/specs/2026-10-25-reply-source-design.md): the replies and their % come from the Lichess explorer or from your own games on chess.com. The rating works with each source.

## Process
We use spec-driven development with a red-green-refactor loop. The unit specs are in `src/**/*.spec.ts` (Vitest). The e2e scenarios are in `e2e/features/` (Cucumber.js and Playwright).
