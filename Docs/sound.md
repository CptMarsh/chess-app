---
type: component
title: Piece sounds
description: The piece sounds adapter makes a move sound and a capture sound with the Web Audio API and plays them. The app has no sound files.
resource: src/sound/sound.ts
tags: [sound, audio, ui]
---

# Piece sounds

`src/sound/sound.ts` makes the sounds of the pieces and plays them. It does not use the bus. The [trainer screen](trainer-screen.md#piece-sounds) decides when a sound plays.

There are two sounds (`Sound`): `"move"` and `"capture"`. The app makes them with the Web Audio API, so it has no sound files, no download and no licence.

## Samples (`pieceSamples`)
`pieceSamples(sound, sampleRate)` gives a `Float32Array` with one channel. Each sound is one or more knocks of wood. A knock is a sine whose pitch falls fast from a high to a low frequency, with a short click of noise.

| Sound | Length | Knocks |
|---|---|---|
| `move` | 80 milliseconds | One knock, 900 Hz to 500 Hz, gain 0.5. |
| `capture` | 140 milliseconds | A knock, 700 Hz to 300 Hz, gain 0.8, and a second knock 40 milliseconds later, gain 0.5. |

Each sample is from -1 to 1. The sound fades out to 0 at the end, so it does not click. The noise comes from a fixed seed, so the samples are the same at each call.

## Player (`PieceSounds`)
`new PieceSounds(makeContext?)` gets an optional function that makes an `AudioContext`. `src/main.ts` uses the default, `() => new AudioContext()`. Tests give a fake context.

`play(sound)`:
1. At the first call, it makes the context. A browser lets a page play a sound only after a user action, and the first sound comes after a click on the board or a key. If the context cannot be made, `play` does nothing, now and later.
2. If the context is `suspended`, it calls `resume()`. A refused `resume()` is not an error.
3. It makes the `AudioBuffer` of each sound one time and keeps it.
4. It starts a new `AudioBufferSourceNode` with the buffer, connected to `context.destination`.

Any error gives silence. The app shows no message.

## Tests
`src/sound/sound.spec.ts` (Vitest) tests the length, the range, the fade and the loudness of the samples, and the player with a fake `AudioContext`: the played buffers, one context and one buffer for each sound, a suspended context, and a context that cannot be made.
