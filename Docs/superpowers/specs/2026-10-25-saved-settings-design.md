---
type: spec
title: Saved settings
description: The design of the saved settings. The app keeps the rating, color and moves fields of the cog in the browser. When there are saved settings, the cog does not open when the app starts.
tags: [spec, ui, settings, storage]
---

# Saved settings

This spec adds to the [Cog, variations and refutation](2026-10-25-cog-variations-refutation-design.md) spec. The parts that this spec does not name stay the same.

## Goal
You type your rating, color and number of moves one time. The next time that you open the app, the fields have the same values, and the cog does not ask for them again.

Success: you change the fields, then reload the app. The settings popover is closed, and the fields show your values.

## Decisions
| Subject | Decision |
|---|---|
| Storage | `localStorage`, the key `lineSettings`, with JSON `{ "rating": "1450", "color": "black", "moves": "5" }`. |
| Values | The texts of the fields, as you typed them. The trainer checks them when you click **New line**, as before. |
| When it saves | On each `change` event of the `Rating`, `Color` and `Moves` fields: when you leave a changed field, or choose a color. |
| Start of the app | With saved settings, the fields get the saved values and the popover stays closed. Without saved settings, the popover opens, as before. |
| Bad data | A text that is not JSON, or has a field of the wrong type, or a color that is not `white` or `black`, counts as no saved settings. |
| Blocked storage | As the token: the store keeps the settings in memory only. |

## Architecture
`line()` and `saveLine()` of the `SettingsStore` in `src/settings/settings.ts` read and write the line settings. The store also keeps the source, the username and the Sound switch.

## Tests
- Unit tests of `line` and `saveLine`: no settings, saved settings, bad texts, a blocked storage, a refused write.
- A new e2e scenario: you change the fields, start a line and reload the app. The settings are closed, and the fields keep their values.
