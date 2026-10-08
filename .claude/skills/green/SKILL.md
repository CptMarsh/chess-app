---
name: green
description: Make red cases pass with the least change, then ready the commit.
disable-model-invocation: true
---

## Goal
$ARGUMENTS

## Least change
The smallest change that flips the Then, at whatever layer it lives. Never edit a spec to make it pass. A spec that turns out wrong is reported, not quietly fixed.

## Prove
Green is every new case passing and every sibling still passing.

## Record
In `progress.md`, set each row to `green`. Under the table, list debt the least change left for `/refactor`: hardcoded values, names that no longer fit, duplication. One line each.

Commit the draft repo: `git -C .claude/currentdocs commit -am "<slug>: green <cases>"`.

## Stop
Take no further action, offer to commit.