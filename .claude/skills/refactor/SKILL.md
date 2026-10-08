---
name: refactor
description: Improve green code to project standards with behavior fixed and the suite as the gate.
disable-model-invocation: true
---

## Goal
$ARGUMENTS

## Candidates
From the debt list under `progress.md`'s table, then from the change itself:
- Loose Coupling: code components should be able to be changed independently of each other.
- High Cohesion: code components that are domain-related should live close together.
- SOLID.
- Duplication across specs: step helpers written twice move into the shared DSL.
- Standards: no comments, no file headers, no hidden defaults in helpers.

List them, one line each, and get the list agreed before editing.

## Rules
Behavior is fixed. No spec assertion or assertion message changes. A step helper may move or be renamed; the case's Given/When/Then lines still read the same. If a refactor needs an assertion changed, it is not a refactor: stop and send it to `/draft`.

## Stop
Take no further action, offer to commit.