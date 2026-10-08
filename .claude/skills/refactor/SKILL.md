---
name: refactor
description: Make the green code agree with the project standards. The code must operate the same. Use the test suite to make sure of this.
disable-model-invocation: true
---

## Task
$ARGUMENTS

## Possible changes
First, find possible changes in the list of technical debt below the table in `progress.md`. Then find possible changes in the new code.
- Loose coupling: It must be possible to change one code component without a change to other components.
- High cohesion: Keep code components of the same domain near each other.
- SOLID.
- The same code in two specs: If two specs have the same step helper, move it into the DSL (domain-specific language) that all specs use.
- Project standards: Do not use comments or file headers. Do not use default values in helpers that the case does not show.

Write a list of the possible changes, with one line for each change. Show the list to the user. Do not change the code before the user gives approval.

## Limits
The code must operate the same. Do not change a spec assertion or an assertion message.

You can move or rename a step helper. The `Given`/`When`/`Then` lines of each case must stay the same.

If it is necessary to change an assertion, the change is not a refactor. Stop and send it to `/draft`.

## Stop
Do not do more work. Tell the user that you can make a commit.
