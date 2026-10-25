---
type: spec
title: Copy PGN
description: The design of the Copy PGN button. A click puts the PGN of the move tree, with its variations, on the clipboard. Then you can paste the line in Lichess or in a chess program.
tags: [spec, ui, pgn, clipboard]
---

# Copy PGN

This spec adds to the [Mobile view and navigation buttons](2026-10-25-mobile-view-design.md) spec. The parts that this spec does not name stay the same.

## Goal
You can keep a line and study it in an other program. A click on **Copy PGN** puts the PGN of the line on the clipboard.

Success: after a line with a variation, you click **Copy PGN** and paste the text in the Lichess analysis board. It shows the line and the variation.

## Decisions
| Subject | Decision |
|---|---|
| Place of the button | **Copy PGN** (`#copyPgn`) is at the bottom of the panel, on the left of **Change token**, in `#bottom`. |
| Content | The movetext of the full move tree, in PGN import format: the main line, then the result `*`. The variations are in parentheses, as in the move list. For example `1. e4 e5 2. Nf3 (2. Bc4 Nf6) 2... Nc6 *`. |
| Place of a variation | As in PGN: a variation comes right after the move that it is an alternative to. This is not the same as the move list, where a variation comes after the row. |
| Tags | No tags. The import of Lichess and of chess programs accepts a PGN with only movetext. |
| The % | Not in the PGN. They are data of the explorer, not of the game. |
| No moves | The PGN is `*`. The button is always enabled. |
| Feedback | After the copy, the button text is `Copied` for 1.5 seconds. If the browser does not copy, `#message` shows `The browser did not copy the PGN.` |
| Clipboard | `navigator.clipboard.writeText`. A click is a user action, so the browser lets the page write. |

## Architecture
Only `src/ui/` changes. `pgnText(nodes)` in `src/ui/text.ts` makes the text. It uses the same move numbers as `moveRows`.

## Tests
- Unit tests of `pgnText`: no moves, a main line, a variation of a White move and of a Black move, a nested variation, a Black move after a variation.
- A new e2e scenario: you play a line with a variation and click **Copy PGN**. The clipboard has the PGN.
