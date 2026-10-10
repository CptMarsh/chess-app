---
type: feature
title: Opening book
description: The player saves PGN lines for White and Black. The book gives the moves that come after a position.
resource: src/book/
tags: [book, pgn]
---

# Opening book

The player pastes a PGN and clicks Save. The page shows the number of lines for each side.

## Messages
| Message | Kind | Listener |
|---|---|---|
| `AddPgn { pgn }` | command | `src/book/commands/addPgn.ts` |
| `MovesAfter { side, moves }` | query | `src/book/queries/movesAfter.ts` |
| `Summary` | query | `src/book/queries/summary.ts` |

`attachBook(bus, store)` in `src/book/book.ts` attaches the three listeners to the [bus](command-query-bus.md).

## Rules
- The header `[Orientation "white"]` or `[Orientation "black"]` gives the side. Letter case is not important.
- A PGN without a side adds nothing.
- A line that the book of the side already has is not added again.
- Comments, NAGs, other headers and Windows line ends do not change the moves.
- `MovesAfter` gives all moves of the side that come after the position. Transposed lines share one position. The position key is the FEN without the two move counters.
- `Summary` gives the number of lines of each side.
- If chess.js cannot read the PGN, `AddPgn` throws. The page catches the error and shows no sign.

## Storage
A line is `{ side, moves }`. `localLineStore` keeps the lines in `localStorage` under `chess-app.lines.v1`. The specs use `memoryLineStore`. The queries read the store on each call. The books under the old key `chess-app.events.v1` are ignored.
