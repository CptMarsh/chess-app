---
name: green
description: Make the red cases green with the smallest change.
disable-model-invocation: true
---

## Task
$ARGUMENTS

## Smallest change
Make the smallest change that makes the case green. Make the change in the layer where it is necessary.

Do not change a spec to make it green. If a spec is not correct, do not correct it. Tell the user about it.

## Make sure
The work is green when all the new cases are green and all the other cases stay green.

## Record
In `progress.md`, set each row to `green`.

Below the table, write a list of the technical debt that the smallest change made. `/refactor` uses this list. Examples are hardcoded values, names that are not correct at this time, and the same code in two or more locations. Write one line for each item.

Commit the draft repository: `git -C .claude/currentdocs commit -am "<slug>: green <cases>"`.

## Stop
Do not do more work. Tell the user that you can make a commit.
