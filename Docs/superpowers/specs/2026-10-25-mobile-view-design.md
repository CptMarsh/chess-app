---
type: spec
title: Mobile view and navigation buttons
description: The design of the mobile view. On a narrow screen, the panel with the move list goes under the board, and the board fits the width of the screen. 4 navigation buttons under the move list do the work of the arrow keys.
tags: [spec, ui, mobile, responsive, navigation]
---

# Mobile view and navigation buttons

This spec changes the [Cog, variations and refutation](2026-10-25-cog-variations-refutation-design.md) spec. The parts that this spec does not name stay the same.

## Goal
1. You can use the app on a phone. The move list (the PGN) is under the board.
2. A phone has no arrow keys. 4 buttons on the screen move through the moves, as the arrow keys do.

Success: on a screen 390 pixels wide, you play a line and move through it with your finger. The page does not scroll sideways.

## Decisions
| Subject | Decision |
|---|---|
| When the mobile view starts | When the screen is 760 pixels wide or less (`@media (max-width: 760px)`). The desktop view needs 24 + 400 + 16 + 320 pixels and the margins of the page. |
| Viewport | `index.html` gets `<meta name="viewport" content="width=device-width, initial-scale=1">`. Without it, a phone shows the page at 980 pixels and makes it small. |
| Layout | `#app` is a column: `#boardRow`, then `#panel`. The order in the panel does not change, so **New line** and the cog stay at the top of the panel, just under the board. |
| Size of the board | `--board-size` on `#app`. It is 400 pixels on the desktop. In the mobile view, it is `min(400px, 100vw - 40px)`: the width of the screen without the eval bar (24 pixels) and the margins of the body (2 × 8 pixels). The eval bar has the same height. Chessground sees the new size with its `ResizeObserver`. |
| Panel in the mobile view | The width of the board row, with no fixed height. The move list has a maximum height of 240 pixels and scrolls. |
| Navigation buttons | `#navigation`, under `#moveList`, in all views. 4 buttons: **Start** (⏮, the same as ↑), **Back** (◀, ←), **Forward** (▶, →) and **End** (⏭, ↓). The name of each button is its `aria-label`. A click calls `nextView` with the key of the button. |
| Delete on a phone | Not in this spec. A right-click is a long press on a phone, but we do not check it. |

## Architecture
Only `src/ui/` and `index.html` change. The navigation functions do not change: the buttons give the key names to `nextView`.

## Tests
- A new e2e scenario: the screen is 390 × 844 pixels. You play 2 moves. The move list is under the board, and the page does not scroll sideways. The 4 buttons move through the moves.
