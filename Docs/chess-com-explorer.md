---
type: component
title: chess.com explorer and source explorer
description: An adapter that gets the replies of a position from your own chess.com games, and the adapter that sends each request to the explorer of the chosen source.
resource: src/explorer/chessCom.ts
tags: [explorer, chess.com, source]
---

# chess.com explorer and source explorer

## chess.com explorer (`src/explorer/chessCom.ts`)
The chess.com explorer is an adapter. It does not use the bus. It replays your games with `chess.js`. chess.com has no opening explorer, so the app counts the moves itself.

`new ChessComExplorer(username, fetchAnswer?, today?)` gets a function that gives your chess.com username (`() => string`). `src/main.ts` gives `() => settings.username()` of the [settings store](settings.md). The optional `fetchAnswer` replaces `fetch`, and the optional `today` (`() => Date`) gives the current date. Tests use them.

`replies(fen, rating)` gives a promise of a list of `Reply` objects (`uci`, `san`, `games`, `percent`), as the [Lichess explorer](lichess-explorer.md). The replies are the moves of your opponents in your games.

### Download
The explorer downloads your games at the first reply for a username. It keeps them in memory for that username. A new username downloads again. A download that fails is not kept, so the next reply tries again. A new page downloads again.

1. It removes the spaces at the start and the end of the username and changes it to lower case.
2. `GET https://api.chess.com/pub/player/{username}/games/archives` gives the addresses of the months that have games.
3. It takes the addresses of the current month and the 11 months before it. It sends a `GET` for each of them, from the oldest to the newest, one request at a time. A month that gives 404 has no games.
4. It keeps only the games with `rules` `chess` and a `time_class` of `blitz`, `rapid` or `daily`, where `white.username` or `black.username` is your username (in any case).
5. For each game, it keeps your color, the rating of your opponent, and the first 40 half-moves of the `pgn`. For each move of your opponent, it keeps the key of the position before the move and the move. When a position comes two times in one game, it keeps only the first move. A move that `chess.js` refuses ends the game: the moves before it stay.

The key of a position is the first 4 fields of the FEN: the pieces, the side to move, the castling and the en passant square. Thus the move numbers do not matter, and a transposition counts, as on Lichess.

### Replies
1. The side to move in `fen` is your opponent. The explorer uses the games where you have the other color.
2. It uses only the games where the rating of your opponent is from `rating - 150` to `rating + 150`.
3. `games` of a move is the number of these games with that move at the key of `fen`. `total` is the sum for all moves.
4. `percent` is `Math.round(games * 100 / total)`.
5. It gives the 5 moves with the most games. With equal games, the code-point order of `san` decides (thus `Nf6` comes before `c6`).

`uci` comes from `chess.js`, so castling is in the standard form (`e1g1`). No game in the position gives an empty list. Then the line ends with `No games at your level after this position.`

### Errors
`replies` throws an `Error`. It sends no request when the username is empty.

| Problem | Message |
|---|---|
| The username is empty. | `Type your chess.com username in the settings.` |
| The archives give 404. | `chess.com has no player {username}.` (The username as you typed it.) |
| chess.com gives 429. | `chess.com got too many requests. Wait one minute, then start a new line.` |
| chess.com gives a different status. | `chess.com did not answer (status 503).` (The number is the status.) |
| The request fails. | `chess.com did not answer (network error).` |

The explorer does not try again.

## Source explorer (`src/explorer/source.ts`)
`new SourceExplorer(source, lichess, chessCom)` gets a function that gives the source (`() => "lichess" | "chessCom"`) and the two explorers. `replies(fen, rating)` calls `replies` of the explorer of the source. It reads the source for each request, so a new source is used from the next reply. `src/main.ts` gives it to the [trainer](trainer.md).

## Notes
- The public API of chess.com needs no token.
- The first reply waits for the download: 1 request for the archives and up to 12 requests for the months.

## Tests
- `src/explorer/chessCom.spec.ts` (Vitest) tests the addresses, the filters, your color, the rating margin, the counts, the order, the cache and each error.
- `src/explorer/source.spec.ts` tests that each source calls its explorer.
- `e2e/features/opening-trainer.feature` has 4 scenarios for chess.com. They route `api.chess.com` to fixed answers.
