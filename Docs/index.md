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

## Specs
- [Opening trainer](superpowers/specs/2026-10-23-opening-trainer-design.md): the design of the opening trainer. We did not build it yet.
- [Opening trainer plan](superpowers/plans/2026-10-23-opening-trainer.md): the tasks that build the opening trainer.

## Process
We use spec-driven development with a red-green-refactor loop. The unit specs are in `src/**/*.spec.ts` (Vitest). The e2e scenarios are in `e2e/features/` (Cucumber.js and Playwright).
