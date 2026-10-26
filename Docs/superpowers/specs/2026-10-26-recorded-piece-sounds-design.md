---
type: spec
title: Recorded piece sounds
description: The design of the recorded piece sounds. The move sound and the capture sound are clicks from a real recording of chess pieces on a wooden board, in place of the synthesized knocks.
tags: [spec, ui, sound]
---

# Recorded piece sounds

This spec changes the [Piece sounds](2026-10-26-piece-sounds-design.md) spec. The parts that this spec does not name stay the same: when a sound plays, the two sounds, the Sound switch and the autoplay rule.

## Goal
The sounds are like the sounds of chess.com: a real piece that lands on a real wooden board. The synthesized knocks of the first spec sound electronic.

Success: you play `e4` and you hear a piece on a board, not a beep.

## Decisions
| Subject | Decision |
|---|---|
| Source | "Chess Pieces Move (Close)" by JJTaynos on Freesound (https://freesound.org/people/JJTaynos/sounds/733927/), CC0 1.0. CC0 needs no credit. `Docs/sound.md` names the source, so the origin stays known. |
| Files | `src/sound/move.wav` and `src/sound/capture.wav`. Each is one click of the recording: at 24.41 s for the move, at 40.95 s for the capture. 0.32 s, 48 kHz, 16 bit, mono, 30 KB. We take the cut of the patzer project (https://github.com/SikamikanikoBG/patzer, `web/src/assets/sounds/board-move.wav` and `board-capture.wav`), which says that it cut them from that recording. |
| Not chess.com | The sounds of chess.com and the standard sounds of Lichess have no free licence. The app does not use them. |
| Load | Vite gives the address of each file (`?url`). At the first sound, the player makes the context and loads both files with `fetch`. Then it decodes them with `decodeAudioData` one time each. |
| First sound | The first sound waits for the load of its file. The files are small and come from the same server, so the wait is short. |
| Errors | A file that does not load or does not decode gives silence, and it is not kept. Thus the next sound tries again. |
| Synthesis | `pieceSamples` goes. |

## Architecture
| Unit | Change |
|---|---|
| `src/sound/sound.ts` | `PieceSounds` plays the decoded files. `pieceSamples` goes. |
| `src/sound/move.wav`, `src/sound/capture.wav` | New. |
| `src/main.ts` | Imports the addresses of the files and gives them to `PieceSounds`. |

### Player (`PieceSounds`)
`new PieceSounds(files, makeContext?, fetchFile?)` gets `files`, the address of each sound (`{ move, capture }`). The optional `makeContext` makes an `AudioContext`, and the optional `fetchFile` (`(url) => Promise<ArrayBuffer>`) replaces `fetch`. Tests use them.

`play(sound)`:
1. At the first call, it makes the context and starts the load of each file. If the context cannot be made, `play` does nothing, now and later.
2. If the context is `suspended`, it calls `resume()`. A refused `resume()` is not an error.
3. It waits for the decoded buffer of the sound. Each file is fetched and decoded one time.
4. It starts a new `AudioBufferSourceNode` with the buffer, connected to `context.destination`.

## Tests
### Unit specs (Vitest)
`src/sound/sound.spec.ts`: each sound plays the buffer of its file. The first sound loads both files. The context is made one time, and each file is fetched and decoded one time. A suspended context is resumed. A context that cannot be made gives silence and no fetch. A failed fetch and a failed decode give silence, and the next sound tries again.

### E2E
No new scenario. The 2 scenarios of the piece sounds count each `start()`. The player calls `start()` only after the browser decodes the file, so these scenarios also check that Chromium loads and decodes the real files.
