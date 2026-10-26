---
type: spec
title: Piece sounds
description: The design of the piece sounds. The app plays a short wooden sound when a move comes on the board, and a stronger sound for a capture. A Sound switch in the cog turns the sounds off.
tags: [spec, ui, sound, settings]
---

# Piece sounds

This spec adds to the [Reply source](2026-10-25-reply-source-design.md) spec. The parts that this spec does not name stay the same.

## Goal
You hear each move, as on a real board. You hear the reply of the line without a look at the board, and a capture sounds different from a quiet move.

Success: you play `e4`, and you hear your move and then the reply. When you turn **Sound** off in the cog, the app is silent.

## Decisions
| Subject | Decision |
|---|---|
| Sounds | Two sounds: **move** and **capture**. A move with `x` in its `san` is a capture. All other moves, also castling and checks, are a move. |
| When | When the board shows a position that is one move after the position that it showed before. The sound is the sound of that move. Thus you hear your move, the reply, a move in explore mode, **Forward** (▶ and the right arrow), and a click on the next move in the move list. |
| Silent | **Back**, **Start**, **End**, a click on an other move, a deleted variation and a new line are silent. When the line takes back a mistake, the return to the position before it is silent. |
| Source of the sounds | The app makes the sounds with the Web Audio API. It has no sound files. Thus there is no download and no licence. |
| Move sound | A short knock of wood: a sine that falls from 900 Hz to 500 Hz, with a click of noise, 80 milliseconds. |
| Capture sound | The same knock, lower (700 Hz to 300 Hz) and louder, with a second knock 40 milliseconds later. 140 milliseconds. |
| Switch | The cog popover gets a **Sound** checkbox (`#sound`) after Username. It is on by default. The app keeps it in the browser, in the key `pieceSound` (`on` or `off`). |
| Autoplay | A browser lets a page play a sound only after a user action. The app makes its `AudioContext` at the first sound, which comes after a click on the board or a key. If the context is suspended, the app calls `resume()`. |
| Errors | When the browser has no Web Audio, or a sound fails, the app is silent. It shows no message. |

## Architecture
The trainer, the line and the explorers do not change.

| Unit | Change |
|---|---|
| `src/sound/sound.ts` | New. `pieceSamples(sound, sampleRate)` makes the samples of a sound. `PieceSounds` is the adapter over the Web Audio API that plays them. |
| `src/ui/text.ts` | New pure function `soundOf(nodes, before, at)`. |
| `src/settings/settings.ts` | `sound()` and `saveSound(on)`. |
| `src/ui/trainerView.ts` | The Sound checkbox. `show()` plays the sound of the shown move. |
| `src/main.ts` | Makes `PieceSounds` and gives it to `mountTrainer`. |

### Sound of a move (`soundOf`)
`soundOf(nodes, before, at)` gives `"move"`, `"capture"` or `null`. `before` is the id of the node that the board showed before, or `null` before the first show. `at` is the id of the node that the board shows now.

- When the node `at` has the parent `before`, it gives `"capture"` if the `san` of `at` has `x`, else `"move"`.
- In all other conditions, it gives `null`.

### Samples (`pieceSamples`)
`pieceSamples(sound, sampleRate)` gives a `Float32Array`: 80 milliseconds of samples for `"move"`, 140 milliseconds for `"capture"`. Each sample is from -1 to 1. The sound fades out, so the last sample is near 0. The noise of the click comes from a fixed seed, so the samples are the same at each call.

### Player (`PieceSounds`)
`new PieceSounds(context?)` gets an optional function that makes an `AudioContext`. Tests use it. `play(sound)`:
1. At the first call, it makes the context. If this throws, `play` does nothing, now and later.
2. If the context is `suspended`, it calls `resume()`. A refused `resume()` is not an error.
3. It makes the `AudioBuffer` of the sound one time, from `pieceSamples(sound, context.sampleRate)`, and keeps it.
4. It makes an `AudioBufferSourceNode` with the buffer, connects it to `context.destination`, and calls `start()`.

### Settings store
| Method | Result |
|---|---|
| `sound()` | `true` or `false`. At the start, the store reads the key `pieceSound` once. Only `off` gives `false`. |
| `saveSound(on)` | Keeps the value in memory, then writes `on` or `off`. If the write throws an error, it stays in memory only. |

### Screen
- `mountTrainer(root, bus, trainer, changeToken, settings, sounds)` gets `sounds` (`{ play(sound) }`) as a new argument. `settings` also gives `sound` and `saveSound`.
- `#settings` gets **Sound** (`#sound`), a checkbox, after Username. It starts with `settings.sound()`. A change calls `settings.saveSound(checked)`.
- `show()` keeps the id of the shown node. It calls `soundOf(nodes, shown before, shown now)`. When the result is not `null` and `settings.sound()` is `true`, it calls `sounds.play(result)`.

## Tests
Each spec file has a `*.steps.ts` file, as now. We write each case red, then green, then refactor.

### Unit specs (Vitest)
| Spec | Cases |
|---|---|
| `src/ui/text.spec.ts` | `soundOf`: the next move, a capture, castling and a check are a move, the next move of a variation, a move back, a jump of two moves, the same node, an other branch, `before` is `null`. |
| `src/sound/sound.spec.ts` | `pieceSamples`: the length of each sound, the samples are from -1 to 1, the end is near 0, the capture is louder, the same samples at each call. `PieceSounds`: it plays a buffer of the sound, it makes the context and each buffer one time, it resumes a suspended context, a context that cannot be made gives silence. |
| `src/settings/settings.spec.ts` | `sound()` is on by default and with any value but `off`. `saveSound` writes `on` and `off`. A blocked `localStorage` and a refused write. |

### E2E (Cucumber and Playwright)
Each scenario counts the sounds: an init script counts each `start()` of an `AudioBufferSourceNode`.

1. **You hear the moves**: you play `e4`. The app plays 2 sounds: your move and the reply. **Back** is silent. **Forward** plays 1 sound.
2. **You turn the sound off**: you turn **Sound** off and play `e4`. The app plays no sound. After a reload, **Sound** is still off.
