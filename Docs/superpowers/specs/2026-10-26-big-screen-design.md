---
type: spec
title: Big screen view
description: The design of the big screen view. On a screen wider than 760 pixels, the board, the eval bar, the panel and the text grow with the window, so the app fills a big monitor.
tags: [spec, ui, responsive, desktop]
---

# Big screen view

This spec changes the [Mobile view and navigation buttons](2026-10-25-mobile-view-design.md) spec. The parts that this spec does not name stay the same.

## Goal
On a big monitor, the app was 400 + 24 + 16 + 320 pixels wide and its text was 15 pixels. It was small in the corner of the screen. Now the app grows with the window.

Success: on a screen 2560 × 1440 pixels, the board is more than 1000 pixels wide, the panel is at the right of the board, and the page does not scroll sideways or down.

## Decisions
| Subject | Decision |
|---|---|
| Size of the board | On a screen wider than 760 pixels, `--board-size` is `max(400px, min(100vh - 16px, (100vw - 32px) / 1.86))`. The board fills the height of the window, without the margins of the body (2 × 8 pixels). The row must also fit the width of the window: the eval bar (0.06 × board), the board, the gap (16 pixels), the panel (0.8 × board) and the margins (2 × 8 pixels). The board is never smaller than the 400 pixels of the old desktop view. |
| Scale | `--unit` on `#app` is `calc(var(--board-size) / 400)`: 1 pixel when the board is 400 pixels. The sizes that were in pixels are now a number of `--unit`: the text (15), its line height (24), the label text (12 and 16), the eval number (10), the eval bar (24), the panel (320), `space-1`, `space-2` and `space-4` (4, 8 and 16), the move number column (40), the engine score (48), the fields in `#settings` (56 and 120) and the cog icon (18). So the screen keeps its proportions at each size. |
| What does not grow | The gap between the board row and the panel (16 pixels), the margins of the body, the borders, the radii and the focus outline. The coordinates of chessground keep their size, because chessground places them in pixels. The token dialog does not change. |
| Copy PGN | It gets the style of **Change token**. Before, it had the default style of the browser, with its own small text that did not grow. |
| Panel | `calc(320 * var(--unit))` wide, and the height of the board. |
| Position | `#app` is in the center of the window, from left to right. |
| Mobile view | In the mobile view (760 pixels or less), `--unit` is `1px`. The mobile view does not change. |

## Architecture
Only `src/ui/trainer.css` changes. Chessground sees the new size of the board with its `ResizeObserver`.

## Tests
- A new e2e scenario: the screen is 2560 × 1440 pixels. You play 2 moves. The board is more than 1000 pixels wide, the move list is at the right of the board, and the page does not scroll sideways or down.
- The other e2e scenarios run at the Playwright default of 1280 × 720 pixels. There, the board is 671 pixels. The steps find the squares from the size of `cg-board`, so they do not change.
