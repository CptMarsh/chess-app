---
type: component
title: Lichess explorer
description: An adapter that gets the most common replies of a position from the Lichess opening explorer.
resource: src/explorer/explorer.ts
tags: [explorer, lichess]
---

# Lichess explorer

The explorer is an adapter. It does not use the bus. It does not know the rules of the line. A later unit (the trainer) calls it.

`new LichessExplorer(token, fetchAnswer?)` gets the Lichess token. The optional second argument replaces `fetch`. Tests use it.

`replies(fen, rating)` gives a promise of a list of `Reply` objects (`uci`, `san` and `games`). It sends a GET request to `https://explorer.lichess.ovh/lichess` with these query parameters:

| Parameter | Value |
|---|---|
| `variant` | `standard` |
| `speeds` | `blitz,rapid,classical` |
| `ratings` | The band of the rating. |
| `fen` | The position. |
| `moves` | `5` |
| `topGames` | `0` |
| `recentGames` | `0` |

The request has the header `Authorization: Bearer <token>`.

`games` is `white + draws + black` from the answer of the explorer.

The explorer gives castling as king to rook, for example `e8h8`. `chess.js` refuses this form. Thus the adapter changes the `uci` of a castling reply to the standard form: `e8h8` becomes `e8g8`, and `e8a8` becomes `e8c8`. The adapter looks at `san`: only a `san` that starts with `O-O` is castling. A rook or queen move from e8 to h8 does not change.

## Rating band
`ratingBand(rating)` gives the highest of 0, 1000, 1200, 1400, 1600, 1800, 2000, 2200 and 2500 that is not more than the rating. For example, 1450 gives 1400, 800 gives 0, and 2600 gives 2500.

## Errors
`replies` throws an `Error`. It sends no request when the token is empty.

| Problem | Message |
|---|---|
| The token is empty. | `Add your Lichess token to .env.local as VITE_LICHESS_TOKEN, then start the app again.` |
| Lichess gives 401. | `Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token.` |
| Lichess gives 429. | `Lichess got too many requests. Wait one minute, then start a new line.` |
| Lichess gives a different status. | `Lichess did not answer (status 503).` (The number is the status.) |
| The request fails. | `Lichess did not answer (network error).` |

The explorer does not try again.

## Setup
1. Make a Lichess personal token at `https://lichess.org/account/oauth/token`. It needs no scopes.
2. Put `VITE_LICHESS_TOKEN=<token>` in `.env.local`. Git ignores `*.local` files.
3. Do not publish the built app. Vite puts the token into the browser code.

## Notes
- The default for `fetchAnswer` is an arrow function that calls the global `fetch`. A browser throws `Illegal invocation` when `fetch` runs with a different `this`.
