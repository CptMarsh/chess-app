---
name: red
description: Write the failing spec for the Given/When/Then cases in the draft. Prove that each case fails on its own Then.
disable-model-invocation: true
---

## Goal
$ARGUMENTS

## Write
Write one test for each case. Give the test a name that tells the outcome. The test body is the case. Write one step call on each line.

- Do not add guards that are not necessary now.
- Do not add comments or file headers.
- Do not change production code to make a case compile. You can add a simple stub. For example, a function that returns false, or a branch that the code never runs. Do not use `throw unimplemented`.

## Prove
A case is red only when these two conditions are true:
- The case fails with the message of its Then.
- All the other cases pass.

All other failures are wrong reds. Examples are a build failure, a harness failure, a Given that failed, and an error from code that the case does not test.

Find the cause of each wrong red. Do not accept it. If the cause is a real bug in the code that the Given uses, fix it with the smallest change. Record the fix and prove the case again. If the fix is not small, stop and ask the user.

## Record
In `progress.md`, set each proven row to `red`. In the row, write its red proof: the failure line, word for word, on one line.

If you fixed a bug in the code that the Given uses, record the fix on a second line under the table. Then `/green` can include the fix in the commit.

Commit the draft repository: `git -C .claude/currentdocs commit -am "<slug>: red <cases>"`.

## Stop
Do not make the cases pass. For each case, tell the user its red proof. Also tell the user about each wrong red that you fixed.
