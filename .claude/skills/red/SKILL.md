---
name: red
description: Write the spec for the Given/When/Then cases in the draft. Make sure that the Then of each case gives a failure.
disable-model-invocation: true
---

## Task
$ARGUMENTS

## Write
Write one test for each case. Give the test a name that tells the result. The test body is the case. Write one step call on each line.

- Do not add guards that are not necessary at this time.
- Do not add comments or file headers.
- Do not change production code to make the compiler accept the case. You can add a stub. The stub must be very small. For example, a function that gives `false`, or a branch that the code does not go into. Do not use `throw unimplemented`.

## Make sure
A case is red only in these two conditions:
- The `Then` of the case gives a failure with its message.
- All the other cases are green.

All other failures are incorrect reds. Examples are a compiler error, a harness failure, a failure in a `Given`, and an error in code that is not part of the case.

Find the cause of each incorrect red. Do not accept it. If the cause is a bug in the code that the `Given` uses, correct it with the smallest change. Record the change and do the test again. If the change is not small, stop. Tell the user about the problem. The user must make the decision.

## Record
In `progress.md`, set the row of each red case to `red`. In the row, write the failure line from the test output, on one line. Do not change the text of the failure line.

If you corrected a bug in the code that the `Given` uses, record the change on a new line below the table. Then `/green` can include the change in the commit.

Commit the draft repository: `git -C .claude/currentdocs commit -am "<slug>: red <cases>"`.

## Stop
Do not make the cases green. For each case, tell the user its failure line. Also tell the user about each incorrect red that you corrected.
