---
type: spec
title: Ask for the Lichess token
description: The design of the token dialog. The app asks you for your Lichess token and keeps it in the browser. The token is not in the build, so the app can be published.
tags: [spec, token, lichess, dialog, storage]
---

# Ask for the Lichess token

This spec changes the [Try again, move list, eval number and dark mode](2026-10-24-try-again-move-list-dark-design.md) spec. The parts that this spec does not name stay the same.

## Goal
Until now, Vite put the token from `VITE_LICHESS_TOKEN` into the browser code. Thus the built app was not safe to publish. Now the app asks you for your token and keeps it in the browser. The build has no token. Each person uses their own token.

Success: you can publish the built app, and the published code holds no token.

## Decisions
| Subject | Decision |
|---|---|
| Where the token comes from | You paste it in the token dialog. `VITE_LICHESS_TOKEN` goes away. |
| Where the token stays | In `localStorage` of the browser, with the key `lichessToken`. If the browser blocks `localStorage`, the app keeps the token only until you close the page. |
| When the dialog opens | When the app starts and has no token, and when you click **Change token**. |
| Without a token | You cannot close the dialog. Escape does nothing. There is no **Cancel**. |
| With a token | **Cancel** and Escape close the dialog. The token does not change. |
| Empty token | **Save** does not close the dialog. The dialog shows `Paste your Lichess token.` The app removes spaces at the start and at the end of the token. |
| Field | `type="password"`, so the token is not shown on the screen. The field is empty each time the dialog opens. |
| Lichess refuses the token | The message tells you to click **Change token**. The app does not remove the token. |

## Architecture
| Unit | Change |
|---|---|
| `src/token/` | New. `TokenStore` reads and saves the token. It is an adapter over `Storage`. It does not use the bus. |
| `src/explorer/` | `LichessExplorer` gets a function that gives the token, not the token. Thus a new token is used for the next request. New messages. |
| `src/ui/` | The new token dialog (`tokenView.ts`). The **Change token** button on the trainer screen. |
| `src/main.ts` | It makes the `TokenStore`. It opens the dialog when there is no token. |

### Token store (`src/token/token.ts`)
`new TokenStore(storage)` gets a function that gives a `Storage` (`() => localStorage`). Reading `localStorage` can throw an error when the browser blocks it. Thus the store asks for it in a `try`.

| Method | Result |
|---|---|
| `read()` | The token, or `""`. At the start, the store reads `lichessToken` once. After that, it gives the token in memory. |
| `save(text)` | It removes the spaces at the start and at the end. An empty result throws `Paste your Lichess token.` and changes nothing. In all other conditions, it keeps the token in memory, then writes it to `lichessToken`. If the write throws an error, the token stays in memory only. |

### Explorer (`src/explorer/`)
`new LichessExplorer(token, fetchAnswer?)`: `token` is now `() => string`. `replies` calls it for each request.

| Problem | Message |
|---|---|
| The token is empty. | `Save your Lichess token first. Click Change token.` |
| Lichess gives 401. | `Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token, then click Change token.` |

The other messages do not change.

### Token dialog (`src/ui/tokenView.ts`)
`mountTokenDialog(root, tokens)` adds a `<dialog id="tokenDialog">` to `root`. It gives the `open` function. `open()` empties the field and the error, shows **Cancel** only when `tokens.read()` is not `""`, and calls `showModal()`.

```
+---------------------------------------------+
| The app gets the moves of other players     |
| from Lichess. Lichess asks for a personal   |
| token. Make one at                          |
| lichess.org/account/oauth/token. It needs   |
| no scopes. The app keeps the token only in  |
| this browser.                               |
|                                             |
| Lichess token [••••••••••••]                |
| Paste your Lichess token.                   |
|                                  [Cancel] [Save] |
+---------------------------------------------+
```

- The link opens `https://lichess.org/account/oauth/token` in a new tab.
- **Save** is the submit button of a `<form>`. Thus Enter in the field also saves. It calls `tokens.save`. If `save` throws, `#tokenError` shows the message. If not, the dialog closes.
- The `cancel` event of the dialog (Escape) does nothing when there is no token (`preventDefault`).

### Trainer screen
`mountTrainer(root, bus, trainer, changeToken)` gets a fourth argument. The panel gets a **Change token** button (`#changeToken`) after `#status`. A click calls `changeToken()`. The button is always enabled. A new token is used from the next explorer request.

### Start of the app (`src/main.ts`)
1. It makes `new TokenStore(() => localStorage)`.
2. It makes the explorer with `() => tokens.read()`.
3. It mounts the token dialog on `document.body`, then the trainer screen. **Change token** calls `open`.
4. If `tokens.read()` is `""`, it calls `open()`.

## Darkwood style
| Part | Token |
|---|---|
| `#tokenDialog` | `surface-200`, `ink` text, a 1-pixel `line-strong` border, the corners `radius-md`, the padding `space-4`, a maximum width of 400 pixels |
| `::backdrop` | Black with opacity 0.6 |
| The link | `amber` |
| The field | The same style as the fields of `#settings`, 240 pixels wide |
| **Save** | The same style as **New line** |
| **Cancel** and **Change token** | No background, `ink-muted` text, a 1-pixel `line-strong` border, the corners `radius-sm` |
| `#tokenError` | `amber` |

## Tests
- Unit (`src/token/token.spec.ts`): `read` with a stored token, without a stored token, and with a blocked `localStorage`. `save` trims the token and writes it. An empty token throws and changes nothing. A blocked write keeps the token in memory.
- Unit (`src/explorer/explorer.spec.ts`): the new messages. Each request calls the token function, so a changed token is used.
- E2e: each scenario starts with the token `e2e-token` in `localStorage` (an init script), except scenarios with the tag `@withoutToken`. New scenarios:
  1. `@withoutToken` The app asks for your token: the dialog is open with no **Cancel**. Escape does not close it. An empty **Save** shows `Paste your Lichess token.` You save `my-token`. The line starts, and the explorer gets `Bearer my-token`. After you reload the page, the dialog is closed.
  2. You change the token: you click **Change token**, save `new-token`, start a line, and the explorer gets `Bearer new-token`.
- The test server no longer sets `VITE_LICHESS_TOKEN`.
