---
name: refactor
description: Make the green code agree with the project standards. Do not change the behavior. Use the test suite as the gate.
disable-model-invocation: true
---

## Goal
$ARGUMENTS

## Candidates
First, find candidates in the debt list under the table in `progress.md`. Then find candidates in the change.
- Loose coupling: You must be able to change one code component without a change to other components.
- High cohesion: Keep code components of the same domain near each other.
- SOLID.
- Duplicate code in specs: If two specs have the same step helper, move it into the shared DSL.
- Standards: Do not use comments, file headers or hidden default values in helpers.

Write a list of the candidates, with one line for each candidate. Make sure that the user agrees to the list before you change the code.

## Rules
Do not change the behavior. Do not change a spec assertion or an assertion message.

You can move or rename a step helper. The Given/When/Then lines of each case must stay the same.

If a refactor needs a change to an assertion, it is not a refactor. Stop and send it to `/draft`.

## Stop
Do not do more work. Ask the user if they want a commit.
