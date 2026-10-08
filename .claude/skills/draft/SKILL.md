---
name: draft
description: Write a draft of a feature as temporary design files in .claude/currentdocs. A local git repository keeps each version, so you can compare the versions.
disable-model-invocation: true
---

These files are drafts. They are not documentation.

## Goal
$ARGUMENTS

## Locate
Make a kebab-case slug from the goal. Put the draft in `.claude/currentdocs/<slug>/`.

If this folder exists, read all the files in it. Then continue that draft. Do not overwrite a draft that you did not read.

If `.claude/currentdocs/.git` does not exist, initialize the repository one time:
- `git -C .claude/currentdocs init`
- `git -C .claude/currentdocs config user.name "design"`
- `git -C .claude/currentdocs config user.email "design@localhost"`

Keep the repository local. Do not add a remote. Do not push.

## Core files
Always write `spec.md` and `design.md`. Put the sections in the order that follows. This order makes the differences between versions easy to read.

`spec.md`
- `## Behaviors`: A numbered list of cases. Write each case on one line in this form: `Given <arrangement>, when <action>, then <observable outcome>.` After the case, write its tier: `(unit)` or `(e2e)`.
  - The outcome is what the player or the caller sees. It is never a class, delegate, flag or function.
  - A rule is a `(unit)` case.
  - An `(e2e)` case only proves the wiring. Do not use it for logic that a unit case can test.
- `## Not in scope`: The things that the feature does not do on purpose.
- `## Open questions`: One question on each line. Start each line with `? `.

`design.md`
- `## Approach`: Some sentences that tell the shape of the solution.
- `## Map`: A table with two columns: the item and its location. You can use paths that do not exist yet.
- `## Traps`: The problems that will occur, and their causes.
- `## Rejected`: A table with two columns: the alternative and the reason that you did not use it.
- `## Open questions`: Use the same `? ` form.

## Extras
Add a different file only when a subject is too large for its section. Use `decisions.md` when two or more decisions each need their own reasons. Use `notes.md` for findings that are not final. Give the file the name of its subject. Do not add a file only to make the draft look complete.

## Commit
At the end of each use of this skill, make a commit. The commit message must tell what changed in this pass. It must not tell what the feature is.
- `git -C .claude/currentdocs add <slug>`
- `git -C .claude/currentdocs commit -m "<slug>: <what changed>"`

Then give the user the commit ID and these two commands:
- `git -C .claude/currentdocs log --oneline -- <slug>`
- `git -C .claude/currentdocs diff HEAD~1 -- <slug>`

## Stop
Tell the user which open questions remain. Then stop. Do not do more work.
