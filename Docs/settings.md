---
type: component
title: Settings store
description: The settings store keeps the source of the replies and your chess.com username in the browser.
resource: src/settings/settings.ts
tags: [settings, storage, source, chess.com]
---

# Settings store

`SettingsStore` is an adapter over `Storage`, as the [token store](token.md). It does not use the bus.

`new SettingsStore(storage)` gets a function that gives a `Storage`. `src/main.ts` gives `() => localStorage`. A browser can block `localStorage`, and then reading it throws an error. Thus the store calls the function in a `try`.

| Method | Result |
|---|---|
| `source()` | `"lichess"` or `"chessCom"`. At the start, the store reads the key `replySource` once. A missing or different value gives `"lichess"`. |
| `username()` | The chess.com username, or `""`. At the start, the store reads the key `chessComUsername` once. |
| `save(source, username)` | It removes the spaces at the start and at the end of the username. It keeps both in memory, then writes them to `replySource` and `chessComUsername`. If the write throws an error, they stay in memory only, until you close the page. |

The **Source** and **Username** fields of the [trainer screen](trainer-screen.md) call `save` at each change. The [source explorer](chess-com-explorer.md#source-explorer-srcexplorersourcets) reads `source()` for each request.

## Tests
`src/settings/settings.spec.ts` (Vitest) tests `source`, `username` and `save`, also with a blocked `localStorage` and a refused write.
