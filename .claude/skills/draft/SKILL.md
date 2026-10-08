---
name: draft
description: Draft a feature into transient design docs under .claude/currentdocs, versioned in a local-only git repo so each revision is diffable. Use when asked to draft, design, spec out, or think through a feature before implementing it.
disable-model-invocation: true
---

These are drafts, never documentation.

## Goal
$ARGUMENTS

## Locate
Kebab-case slug from the goal. Home is `.claude/currentdocs/<slug>/`. If it exists, Read every file in it and continue that draft. Never overwrite a draft you have not read. If `.claude/currentdocs/.git` is absent, initialize once:
- `git -C .claude/currentdocs init`
- `git -C .claude/currentdocs config user.name "design"`
- `git -C .claude/currentdocs config user.email "design@localhost"`

Local only: no remote, no push.

## Core files
`spec.md` and `design.md` always, sections in this order so revisions diff cleanly.

`spec.md`
- `## Behaviors` numbered cases, each one line of `Given <arrangement>, when <action>, then <observable outcome>.` followed by its tier, `(unit)` or `(e2e)`. The outcome is what the player or caller sees, never a class, delegate, flag, or function. A rule is `(unit)`; `(e2e)` proves wiring only, never logic a unit case could hold.
- `## Not in scope` what this deliberately does not do.
- `## Open questions` one per line, each opening with `? `.

`design.md`
- `## Approach` a few sentences, the shape of the solution.
- `## Map` table: thing, where it lives. Proposed paths are fine.
- `## Traps` what will go wrong and why.
- `## Rejected` table: alternative, why not.
- `## Open questions` same `? ` form.

## Extras
Another file only when a subject outgrows its section: `decisions.md` when several choices each need their own reasoning, `notes.md` for scratch findings. Name the file for its subject. Never add one to look thorough.

## Commit
End every invocation with a commit naming what changed this pass, not what the feature is:
- `git -C .claude/currentdocs add <slug>`
- `git -C .claude/currentdocs commit -m "<slug>: <what changed>"`

Then give the user the commit id, `git -C .claude/currentdocs log --oneline -- <slug>`, and `git -C .claude/currentdocs diff HEAD~1 -- <slug>`.

## Stop
Name the open questions that remain and stop. Take no further action.
