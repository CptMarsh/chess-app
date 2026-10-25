---
type: component
title: Token store and token dialog
description: The token store keeps your Lichess token in the browser. The token dialog asks you for the token.
resource: src/token/token.ts
tags: [token, lichess, storage, dialog]
---

# Token store and token dialog

The Lichess explorer needs a personal token. The app asks you for it and keeps it in the browser. The build of the app holds no token, so you can publish it. Each person uses their own token.

## Token store (`src/token/token.ts`)

`TokenStore` is an adapter over `Storage`. It does not use the bus.

`new TokenStore(storage)` gets a function that gives a `Storage`. `src/main.ts` gives `() => localStorage`. A browser can block `localStorage`, and then reading it throws an error. Thus the store calls the function in a `try`.

| Method | Result |
|---|---|
| `read()` | The token, or `""`. At the start, the store reads the key `lichessToken` once. After that, it gives the token in memory. |
| `save(text)` | It removes the spaces at the start and at the end. An empty result throws `Paste your Lichess token.` and changes nothing. In all other conditions, it keeps the token in memory, then writes it to `lichessToken`. If the write throws an error, the token stays in memory only, until you close the page. |

## Token dialog (`src/ui/tokenView.ts`)

`mountTokenDialog(root, tokens)` adds a `<dialog id="tokenDialog">` to `root` (`src/main.ts` gives `document.body`). It gives the `open` function.

| Part | Content |
|---|---|
| Text | Why the app needs the token, and a link to `https://lichess.org/account/oauth/token` (new tab). The token needs no scopes. |
| `Lichess token` field (`#tokenField`) | `type="password"`. It is empty each time the dialog opens. |
| `#tokenError` | The error of `save`, for example `Paste your Lichess token.` |
| **Cancel** (`#tokenCancel`) | Closes the dialog. The token does not change. It is hidden when there is no token. |
| **Save** (`#tokenSave`) | The submit button of the form. Enter in the field also saves. It calls `tokens.save`. If `save` throws, `#tokenError` shows the message and the dialog stays open. If not, the dialog closes. |

`open()` empties the field and `#tokenError`, hides **Cancel** when `tokens.read()` is `""`, and calls `showModal()`. Without a token, Escape does not close the dialog: the `cancel` event calls `preventDefault`.

The dialog opens when the app starts and has no token, and when you click **Change token** on the [trainer screen](trainer-screen.md). The explorer reads the token for each request, so a new token is used from the next request.

### Darkwood style (`src/ui/token.css`)

| Part | Token |
|---|---|
| `#tokenDialog` | `surface-200`, `ink` text, a 1-pixel `line-strong` border, the corners `radius-md`, the padding `space-4`, a maximum width of 400 pixels |
| `::backdrop` | Black with opacity 0.6 |
| The link and `#tokenError` | `amber` |
| The field | The same style as the fields of `#settings`, 240 pixels wide |
| **Save** | The same style as **New line** |
| **Cancel** and **Change token** | No background, `ink-muted` text, a 1-pixel `line-strong` border, the corners `radius-sm` |

## Safety

- The token is in `localStorage` of the origin of the app. Other code on the same origin can read it. On GitHub Pages, all project pages of one user share the origin `<user>.github.io`.
- Make the token with no scopes. Then it can only read public data.
- If Lichess refuses the token, the message tells you to click **Change token**. The app does not remove the token.

## Tests

- `src/token/token.spec.ts` (Vitest) tests `read` and `save`, also with a blocked `localStorage` and a refused write.
- `e2e/features/opening-trainer.feature` has 2 scenarios for the dialog. See [Trainer screen](trainer-screen.md).
