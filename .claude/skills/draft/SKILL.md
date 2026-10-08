---
name: draft
description: Write a draft of a feature in temporary files in .claude/currentdocs. A local git repository keeps each version. Thus, you can compare the versions.
disable-model-invocation: true
---

These files are drafts. They are not documentation.

## Task
$ARGUMENTS

## Find the draft
Make a kebab-case slug from the task. Put the draft in `.claude/currentdocs/<slug>/`.

If there is a folder with this name, read all the files in it. Then continue this draft. Do not overwrite a draft that you did not read.

If there is not a `.git` folder in `.claude/currentdocs`, initialize the repository one time:
- `git -C .claude/currentdocs init`
- `git -C .claude/currentdocs config user.name "design"`
- `git -C .claude/currentdocs config user.email "design@localhost"`

Keep the repository local. Do not add a remote. Do not push.

## Necessary files
Always write `spec.md` and `design.md`. Put the sections in the sequence that follows. This sequence makes the differences between versions easy to read.

`spec.md`
- `## Cases`: A list of cases. Give each case a number. Use this text for each case, on one line: `Given <arrangement>, when <action>, then <result>.` After the case, write its tier: `(unit)` or `(e2e)`.
  - The result is an indication that the player sees or a value that the caller receives. It is not a class, delegate, flag or function.
  - A rule is a `(unit)` case.
  - An `(e2e)` case only makes sure that the components connect correctly. If a `(unit)` case can do the test of the logic, do not use an `(e2e)` case.
- `## Not included`: The items that the feature does not include because of a decision.
- `## Necessary decisions`: The decisions that the user must make. Write one decision on each line. Start each line with `? `.

`design.md`
- `## Solution`: A short paragraph that tells the structure of the solution.
- `## Map`: A table with two columns: the item and its location. You can use paths for new files.
- `## Problems`: The problems that will occur, and their causes.
- `## Alternatives`: A table with two columns: the alternative and the problem with it.
- `## Necessary decisions`: Write them as in `spec.md`.

## More files
Add a file only when a section is too large. Use `decisions.md` when two or more decisions are too large for their section. Use `notes.md` for temporary results. For a different file, use a name that tells the contents of the file.

## Commit
Each time that you use this skill, make a commit at the end. The commit message must tell about the changes that you made. It must not tell about the feature.
- `git -C .claude/currentdocs add <slug>`
- `git -C .claude/currentdocs commit -m "<slug>: <changes>"`

Then give the user the commit ID and these two commands:
- `git -C .claude/currentdocs log --oneline -- <slug>`
- `git -C .claude/currentdocs diff HEAD~1 -- <slug>`

## Stop
Tell the user about the decisions that the user must make. Then stop. Do not do more work.
