---
type: spec
title: Reply source
description: The design of a choice of source for the replies and their %. The source is the Lichess explorer, as now, or your own games on chess.com. The rating works with each source.
tags: [spec, opening, trainer, settings, explorer, lichess, chess.com]
---

# Reply source

This spec changes the [Cog, variations and refutation](2026-10-25-cog-variations-refutation-design.md) and the [Ask for the Lichess token](2026-10-25-lichess-token-design.md) specs. The parts that this spec does not name stay the same.

## Goal
You choose where the replies of the line and their % come from:
1. **Lichess**: the Lichess explorer, as now.
2. **chess.com**: your own games on chess.com. The replies are the moves that your opponents played against you in that position.

The rating works with each source. With Lichess, it gives the rating band, as now. With chess.com, it keeps only the games against opponents near that rating.

Success: you practise against the moves that your real opponents play against you, at the level that you choose.

## Decisions
| Subject | Decision |
|---|---|
| Whose moves | With chess.com, the replies are the moves of your opponents in your games. When you play White, the app uses your White games. When you play Black, it uses your Black games. |
| Rating with chess.com | Only games where the rating of your opponent is from `rating - 150` to `rating + 150`. The rating of the opponent is the rating in the game. |
| Rating with Lichess | No change: the rating band of the Lichess explorer. |
| Games | The games of the last 12 months: the current month and the 11 months before it. |
| Time controls | chess.com `time_class` `blitz`, `rapid` and `daily`. No `bullet`. Only `rules` `chess` (no variants). |
| Settings | The cog popover gets a **Source** select (Lichess, chess.com) and a **Username** field. The Username field shows only when the source is chess.com. The app keeps the source and the username in the browser. |
| Token | The token dialog opens at the start only when the source is Lichess and there is no token. chess.com needs no token. **Change token** stays. |
| Cache | Memory only. The app downloads your games one time for each username, at the first reply after the page opens. A new page downloads them again. |

## Facts that we must check
The sandbox of this session could not reach `api.chess.com`. Before the plan, check these facts in a browser and write them here:
- The chess.com public API answers a request from the origin of the app (CORS). If it does not, this spec cannot work in the browser. Then we decide again.
- `GET https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}` gives `{ games: [...] }`. Each game has `pgn`, `rules`, `time_class`, and `white` and `black` with `username` and `rating`.
- A month without games gives `{ games: [] }` or 404.
- An unknown username gives 404.
- chess.com asks for requests one at a time. Parallel requests can give 429.

## Architecture
The trainer stays the one async unit, and it does not change. It uses the `Explorer` type `{ replies(fen, rating) }`. Only `src/line/` and the new explorer hold chess rules. The new explorer uses `chess.js` to replay the games.

| Unit | Change |
|---|---|
| `src/explorer/chessCom.ts` | New. `ChessComExplorer` gives the replies from your chess.com games. |
| `src/explorer/source.ts` | New. `SourceExplorer` sends each request to the explorer of the chosen source. |
| `src/settings/settings.ts` | New. `SettingsStore` keeps the source and the username in `localStorage`. |
| `src/ui/trainerView.ts` | The Source select and the Username field in the cog popover. |
| `src/main.ts` | Makes the explorers and the store. Opens the token dialog only when the source is Lichess and there is no token. |
| `src/explorer/explorer.ts` | No change. |

### Settings store (`src/settings/settings.ts`)
`SettingsStore` is an adapter over `Storage`, as the [token store](../../token.md). `new SettingsStore(storage)` gets a function that gives a `Storage`. It calls the function in a `try`, because a browser can block `localStorage`.

| Method | Result |
|---|---|
| `source()` | `"lichess"` or `"chessCom"`. At the start, it reads the key `replySource` once. A missing or different value gives `"lichess"`. |
| `username()` | The username, or `""`. At the start, it reads the key `chessComUsername` once. |
| `save(source, username)` | Removes the spaces at the start and at the end of the username. Keeps both in memory, then writes them. If the write throws an error, they stay in memory only. |

### chess.com explorer (`src/explorer/chessCom.ts`)
`new ChessComExplorer(username, fetchAnswer?, today?)` gets a function that gives the username (`() => string`). The optional `fetchAnswer` replaces `fetch`, and the optional `today` (`() => Date`) gives the current date. Tests use them.

`replies(fen, rating)` gives a promise of a list of `Reply` objects (`uci`, `san`, `games`, `percent`), as the Lichess explorer.

#### Download
1. If there are no games in memory for this username, the explorer downloads them. It changes the username to lower case.
2. It sends `GET https://api.chess.com/pub/player/{username}/games/{YYYY}/{MM}` for each of the 12 months, from the oldest to the newest, one request at a time. `MM` has 2 digits.
3. It keeps only the games with `rules` `chess` and a `time_class` of `blitz`, `rapid` or `daily`.
4. For each game, it finds your color: the side whose `username` in lower case is your username. It keeps your color and the rating of your opponent.
5. It replays the `pgn` with `chess.js`. It keeps the first 40 half-moves. For each half-move of your opponent, it keeps the key of the position before the move, and the `uci` and the `san` of the move.
6. It keeps the result in memory for this username. A download that fails is not kept. Thus the next reply tries again.

The key of a position is the first 4 fields of the FEN from `chess.js`: the pieces, the side to move, the castling and the en passant square. Thus the move numbers do not matter, and a transposition counts, as on Lichess.

`chess.js` gives castling in the standard form (`e1g1`). Thus this explorer does not change the `uci`.

#### Replies
1. The side to move in `fen` is your opponent. Your color is the other side.
2. The explorer takes the games with your color and with an opponent rating from `rating - 150` to `rating + 150`.
3. In these games, it counts each move of your opponent at the key of `fen`. One game counts one time for a position, also when the position comes two times.
4. `games` of a move is its count. `total` is the sum of the counts at this key.
5. `percent` is `Math.round(games * 100 / total)`.
6. It gives the 5 moves with the most games, the most games first. With equal games, the order of `san` decides.

When no game has this position, the list is empty. Then the line ends with `No games at your level after this position.`, as now.

#### Errors
`replies` throws an `Error`. It sends no request when the username is empty.

| Problem | Message |
|---|---|
| The username is empty. | `Type your chess.com username in the settings.` |
| chess.com gives 404 for the newest month. | `chess.com has no player {username}.` |
| chess.com gives 404 for an older month. | No error. The month has no games. |
| chess.com gives 429. | `chess.com got too many requests. Wait one minute, then start a new line.` |
| chess.com gives a different status. | `chess.com did not answer (status 503).` (The number is the status.) |
| The request fails. | `chess.com did not answer (network error).` |
| A `pgn` has a move that `chess.js` refuses. | No error. The explorer keeps the moves before it. |

The explorer does not try again.

### Source explorer (`src/explorer/source.ts`)
`new SourceExplorer(source, lichess, chessCom)` gets a function that gives the source (`() => "lichess" | "chessCom"`) and the two explorers. `replies(fen, rating)` calls `replies` of the chosen explorer. It reads the source for each request, so a new source is used from the next reply.

### Screen (`src/ui/`)
- `#settings` gets two fields after Moves:
  - **Source** (`#source`): a select with `Lichess` (`lichess`) and `chess.com` (`chessCom`).
  - **Username** (`#username`): a text field. Its label is hidden when the source is Lichess.
- When the screen starts, the fields get the values of the store.
- A change of either field calls `settings.save(source, username)`.
- `mountTrainer` gets the settings store as a new argument.
- The style of the new fields is the style of the other fields of `#settings`.

### Start (`src/main.ts`)
- `new SettingsStore(() => localStorage)`.
- `new SourceExplorer(() => settings.source(), lichess, new ChessComExplorer(() => settings.username()))` goes to the trainer.
- The token dialog opens at the start when `settings.source()` is `"lichess"` and `tokens.read()` is `""`. If you then choose Lichess without a token, the Lichess explorer gives `Save your Lichess token first. Click Change token.`, as now.

## Notes
- The first reply with chess.com waits for 12 requests. The status says `Waiting for a reply`, as now. We decide about a progress text later.
- Your games against opponents near your rating give fewer games than Lichess. Thus lines with chess.com end sooner.

## Tests
Each spec file has a `*.steps.ts` file, as now. We write each case red, then green, then refactor.

### Unit specs (Vitest)
| Spec | Cases |
|---|---|
| `src/settings/settings.spec.ts` | `source` and `username` from the storage. A missing or wrong source gives `lichess`. `save` removes the spaces and writes. A blocked `localStorage` and a refused write. |
| `src/explorer/chessCom.spec.ts` | The 12 addresses, from the oldest month to the newest, in lower case, one at a time, also across a new year. Only `chess` games of `blitz`, `rapid` and `daily`. Your color from the username in any case. Replies for White to move and for Black to move. The rating margin at -150 and +150, and outside it. A transposition counts. A position two times in one game counts one time. The 5 moves with the most games, and the order. `percent`. Castling in the standard form. Only the first 40 half-moves. A bad `pgn` keeps the moves before the bad move. The download happens one time for a username, and again for a new username. A failed download is not kept. Each error of the table. No request for an empty username. |
| `src/explorer/source.spec.ts` | Each source calls its explorer. A new source is used from the next request. |

### E2E (Cucumber and Playwright)
The scenarios route `api.chess.com` to fixed answers, so they do not use the network.

1. The app replies with a move of your opponents: with the source chess.com and a username, your first move gets the reply from the fixed games, with its %.
2. The source and the username stay after a reload.
3. The token dialog does not open at the start when the source is chess.com and there is no token.
4. An unknown username stops the line with `chess.com has no player {username}.`
