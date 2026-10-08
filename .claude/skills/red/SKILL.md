---
name: red
description: Write the failing spec for drafted Given/When/Then cases and prove each fails on its own Then.
disable-model-invocation: true
---

## Goal
$ARGUMENTS

## Write
One test per case, named for the outcome. The body is the case, one step call per line:

- No speculative guards, no comments, no file header.
- Production code is not touched to make a case compile beyond an honest stub: returns false, branch never taken, never `throw unimplemented`.

## Prove
A case is red only when it fails on its Then's message with its siblings green.

A wrong red is anything else: build failure, harness failure, a Given that failed, an error from code the case does not target. A wrong red is diagnosed, not accepted. When the cause is a real bug in the arrange's path, fix it as the smallest change, record the fix, and prove again. When the fix is more than small, stop and ask.

## Record
In `progress.md`, set each proven row to `red` and put its red proof in: the verbatim failure line, one line. Record any arrange fix as a second line under the table, so `/green` can carry it into the commit.

Commit the draft repo: `git -C .claude/currentdocs commit -am "<slug>: red <cases>"`.

## Stop
Do not make it pass. Report each case's red proof and any wrong reds you fixed on the way.
