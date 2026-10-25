---
type: component
title: Settings store
description: The settings store keeps the rating, color and moves fields of the cog in the browser.
resource: src/settings/settings.ts
tags: [settings, storage]
---

# Settings store

`SettingsStore` is an adapter over `Storage`, as the [token store](token.md). It does not use the bus.

`new SettingsStore(storage)` gets a function that gives a `Storage`. `src/main.ts` gives `() => localStorage`. A browser can block `localStorage`, and then reading it throws an error. Thus the store calls the function in a `try`.

A `Settings` value is `{ rating, color, moves }`. `rating` and `moves` are the texts of the fields, as you typed them. `color` is `white` or `black`.

| Method | Result |
|---|---|
| `read()` | The settings, or `null`. At the start, the store reads the key `settings` once and parses its JSON. A text that is not JSON, a field of the wrong type or a color that is not `white` or `black` gives `null`. After that, it gives the settings in memory. |
| `save(settings)` | It keeps a copy of the settings in memory, then writes them as JSON to `settings`. If the write throws an error, the settings stay in memory only, until you close the page. |

The [trainer screen](trainer-screen.md) reads the settings when it starts, and saves them on each `change` in `#settings`.

## Tests
`src/settings/settings.spec.ts` (Vitest) tests the store with a fake `Storage`.
