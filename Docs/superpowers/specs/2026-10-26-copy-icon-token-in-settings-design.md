---
type: spec
title: Copy icon and Change token in the settings
description: The design of the copy icon and the new place of Change token. Copy PGN is a small copy icon next to the cog. Change token is the last line of the settings. The bottom row of the panel goes away.
tags: [spec, ui, settings, clipboard, token]
---

# Copy icon and Change token in the settings

This spec changes the [Copy PGN](2026-10-25-copy-pgn-design.md), [Ask for the Lichess token](2026-10-25-lichess-token-design.md) and [Big screen view](2026-10-26-big-screen-design.md) specs. The parts that this spec does not name stay the same.

## Goal
The panel shows the line, not tools that you seldom use. **Change token** goes behind the cog. **Copy PGN** becomes a small, known copy icon.

Success: the panel has no bottom row. A click on the copy icon puts the PGN on the clipboard and shows a check mark. **Change token** is in the settings.

## Decisions
| Subject | Decision |
|---|---|
| Copy button | `#copyPgn` in `#tools`, on the left of the cog, at the top right of the panel. An inline SVG of 2 sheets (the usual copy icon), 18 × 18 pixels, in `currentColor`. It has the style of the cog. Its `aria-label` and `title` are `Copy PGN`. |
| After a copy | The icon is a check mark, and the `aria-label` and `title` are `Copied`, for 1.5 seconds. Then the button is `Copy PGN` with the copy icon again. If the browser does not copy, the message stays `The browser did not copy the PGN.` |
| Change token | The last line of `#settings`, with `space-2` above it. It keeps its style. A click closes `#settings` and opens the token dialog. |
| Bottom row | `#bottom` goes away. |
| Error texts | The explorer texts that name **Change token** say where it is: `Save your Lichess token first. Click Change token in the settings.` and `Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token, then click Change token in the settings.` |

## Architecture
`src/ui/trainerView.ts`, `src/ui/trainer.css`, `src/ui/token.css` and the 2 error texts in `src/explorer/explorer.ts` change.

## Tests
- `src/explorer/explorer.spec.ts`: the 2 error texts.
- The Copy PGN scenario clicks the button `Copy PGN`. The step `the copy button is an icon named "Copied"` checks that the button has an SVG and no text.
- The scenario "You change the token" uses the step `the player clicks "Change token" in the settings`. It opens the settings if they are closed.
