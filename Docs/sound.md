---
type: component
title: Piece sounds
description: The piece sounds adapter plays a recorded move sound and a recorded capture sound with the Web Audio API. The sounds are clicks of real chess pieces on a wooden board.
resource: src/sound/sound.ts
tags: [sound, audio, ui]
---

# Piece sounds

`src/sound/sound.ts` plays the sounds of the pieces. It does not use the bus. The [trainer screen](trainer-screen.md#piece-sounds) decides when a sound plays.

There are two sounds (`Sound`): `"move"` and `"capture"`.

## Files
| Sound | File |
|---|---|
| `move` | `src/sound/move.wav` |
| `capture` | `src/sound/capture.wav` |

Each file is one click from "Chess Pieces Move (Close)" by JJTaynos on Freesound (https://freesound.org/people/JJTaynos/sounds/733927/), released under CC0 1.0. CC0 needs no credit. This page names the source so the origin stays known. The move is the click at 24.41 s and the capture is the click at 40.95 s. Each file is 0.32 s, 48 kHz, 16 bit, mono, 30 KB. The cut comes from the patzer project (https://github.com/SikamikanikoBG/patzer, `web/src/assets/sounds/board-move.wav` and `board-capture.wav`).

The sounds of chess.com and the standard sounds of Lichess have no free licence, so the app does not use them.

`src/main.ts` imports the address of each file with `?url`. Vite copies the files to `dist/assets/` with a hash in the name.

## Player (`PieceSounds`)
`new PieceSounds(files, makeContext?, fetchFile?)` gets `files`, the address of each sound (`{ move, capture }`). The optional `makeContext` makes an `AudioContext` (default `() => new AudioContext()`). The optional `fetchFile` gives the bytes of a file (default: `fetch`). Tests give fakes.

`play(sound)`:
1. At the first call, it makes the context and starts the load of both files. A browser lets a page play a sound only after a user action, and the first sound comes after a click on the board or a key. If the context cannot be made, `play` does nothing, now and later.
2. If the context is `suspended`, it calls `resume()`. A refused `resume()` is not an error.
3. It waits for the decoded buffer of the sound. Each file is fetched and decoded with `decodeAudioData` one time, then kept. Thus only the first sound waits for its file.
4. It starts a new `AudioBufferSourceNode` with the buffer, connected to `context.destination`.

A file that does not load or does not decode gives silence. It is not kept, so the next sound tries again. The app shows no message.

## Tests
`src/sound/sound.spec.ts` (Vitest) tests the player with a fake `AudioContext` and a fake `fetchFile`: the played buffers, the load of both files at the first sound, one context and one fetch and decode for each file, a suspended context, a context that cannot be made, and a file that does not load or decode. The e2e scenarios of the piece sounds count each `start()`, so they also check that Chromium loads and decodes the real files.
