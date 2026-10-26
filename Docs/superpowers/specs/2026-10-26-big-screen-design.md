---
type: spec
title: Big screen view
description: The design of the big screen view. On a screen wider than 760 pixels, the board grows with the window. The panel gets 320 to 480 pixels, and the text keeps its size.
tags: [spec, ui, responsive, desktop]
---

# Big screen view

This spec changes the [Mobile view and navigation buttons](2026-10-25-mobile-view-design.md) spec. The parts that this spec does not name stay the same.

## Goal
On a big monitor, the app was 400 + 24 + 16 + 320 pixels wide. It was small in the corner of the screen. Now the board grows with the window.

Success: on a screen 1920 × 950 pixels (a 1080p monitor without the bars of the browser), the board is more than 900 pixels wide, the panel is at the right of the board, the text of the move list is 15 pixels, and the page does not scroll sideways or down.

## Decisions
| Subject | Decision |
|---|---|
| What grows | Only the board, and the eval bar and the panel get its height. The text, the spaces, the buttons and the fields keep their size. |
| Width of the panel | `--panel-width` on `#app` is `clamp(320px, 25vw, 480px)`. |
| Size of the board | On a screen wider than 760 pixels, `--board-size` is `max(400px, min(100vh - 16px, 100vw - 56px - var(--panel-width)))`. The board fills the height of the window, without the margins of the body (2 × 8 pixels). It also fits the width that the eval bar (24 pixels), the gap (16 pixels), the panel and the margins leave. It is never smaller than the 400 pixels of the old desktop view. |
| Rank numbers | A rank number of chessground goes past the bottom of the board. When the board fills the height of the window, the page scrolls. `#boardRow` gets `overflow-y: clip`. |
| Position | `#app` is in the center of the window, from left to right. |
| Copy PGN | It gets the style of **Change token**. Before, it had the default style of the browser. |
| Mobile view | The mobile view (760 pixels or less) does not change. |

## Rejected
The first version scaled the text, the spaces and the panel with the board (a `--unit` of `board / 400`). On a big monitor the panel looked zoomed in. And its test used 2560 × 1440 pixels, where the width of the window limits the board, so the test did not find the scroll from the rank numbers.

## Architecture
Only `src/ui/trainer.css` changes. Chessground sees the new size of the board with its `ResizeObserver`.

## Tests
- The e2e scenario of a big monitor: the screen is 1920 × 950 pixels. You play 2 moves. The board is more than 900 pixels wide, the move list is at the right of the board, its text is 15 pixels, and the page does not scroll sideways or down.
- The other e2e scenarios run at the Playwright default of 1280 × 720 pixels. The steps find the squares from the size of `cg-board`, so they do not change.
