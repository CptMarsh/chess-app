---
name: green
description: Make the red cases pass with the smallest change.
disable-model-invocation: true
---

## Goal
$ARGUMENTS

## Smallest change
Make the smallest change that makes the Then pass. The change can be at any layer.

Do not change a spec to make it pass. If a spec is wrong, do not correct it. Tell the user about it.

## Prove
The work is green when all the new cases pass and all the other cases continue to pass.

## Record
In `progress.md`, set each row to `green`.

Under the table, write a list of the debt that the smallest change made for `/refactor`. Examples are hardcoded values, names that are not correct now, and duplicate code. Write one line for each item.

Commit the draft repository: `git -C .claude/currentdocs commit -am "<slug>: green <cases>"`.

## Stop
Do not do more work. Ask the user if they want a commit.
