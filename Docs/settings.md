---
type: component
title: Settings store
description: The settings store keeps the source of the replies, your chess.com username and the Sound switch in the browser.
resource: src/settings/settings.ts
tags: [settings, storage, source, chess.com, sound]
---

# Settings store

`SettingsStore` is an adapter over `Storage`, as the [token store](token.md). It does not use the bus.

`new SettingsStore(storage)` gets a function that gives a `Storage`. `src/main.ts` gives `() => localStorage`. A browser can block `localStorage`, and then reading it throws an error. Thus the store calls the function in a `try`.

| Method | Result |
|---|---|
| `source()` | `"lichess"` or `"chessCom"`. At the start, the store reads the key `replySource` once. A missing or different value gives `"lichess"`. |
| `username()` | The chess.com username, or `""`. At the start, the store reads the key `chessComUsername` once. |
| `save(source, username)` | It removes the spaces at the start and at the end of the username. It keeps both in memory, then writes them to `replySource` and `chessComUsername`. If the write throws an error, they stay in memory only, until you close the page. |
| `sound()` | `true` or `false`: the piece sounds are on or off. At the start, the store reads the key `pieceSound` once. Only `off` gives `false`, so the sounds are on by default. |
| `saveSound(on)` | It keeps the value in memory, then writes `on` or `off` to `pieceSound`. If the write throws an error, the value stays in memory only. |

The **Source** and **Username** fields of the [trainer screen](trainer-screen.md) call `save` at each change. The **Sound** field calls `saveSound` at each change, and the screen reads `sound()` before each [piece sound](sound.md). The [source explorer](chess-com-explorer.md#source-explorer-srcexplorersourcets) reads `source()` for each request.

## Tests
`src/settings/settings.spec.ts` (Vitest) tests `source`, `username`, `save`, `sound` and `saveSound`, also with a blocked `localStorage` and a refused write.
