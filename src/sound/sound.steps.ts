import { expect } from "vitest";
import { PieceSounds, type Sound } from "./sound.ts";

const FILES: Record<Sound, string> = { move: "/move.wav", capture: "/capture.wav" };

type FakeBuffer = { url: string };
type TestContext = {
  sounds: PieceSounds;
  made: number;
  fetched: string[];
  decoded: string[];
  started: string[];
  resumed: number;
};
// The file that fails one time, and how.
type Failure = { sound: Sound; when: "fetch" | "decode" } | null;

function contextOf(state: AudioContextState, cannotBeMade = false, failure: Failure = null): TestContext {
  const test: TestContext = { sounds: undefined!, made: 0, fetched: [], decoded: [], started: [], resumed: 0 };
  let failing = failure;
  const failsNow = (url: string, when: "fetch" | "decode") => {
    if (failing === null || FILES[failing.sound] !== url || failing.when !== when) return false;
    failing = null;
    return true;
  };
  const fetchFile = (url: string) => {
    test.fetched.push(url);
    if (failsNow(url, "fetch")) return Promise.reject(new TypeError("Failed to fetch"));
    return Promise.resolve(new TextEncoder().encode(url).buffer as ArrayBuffer);
  };
  const make = () => {
    test.made += 1;
    if (cannotBeMade) throw new DOMException("No audio.", "NotSupportedError");
    const destination = {};
    return {
      state,
      destination,
      resume: () => {
        test.resumed += 1;
        return Promise.reject(new DOMException("Not allowed.", "NotAllowedError"));
      },
      decodeAudioData: (data: ArrayBuffer) => {
        const url = new TextDecoder().decode(data);
        test.decoded.push(url);
        if (failsNow(url, "decode")) return Promise.reject(new DOMException("Unable to decode.", "EncodingError"));
        return Promise.resolve({ url });
      },
      createBufferSource: () => {
        const source = {
          buffer: null as FakeBuffer | null,
          connected: null as unknown,
          connect: (node: unknown) => { source.connected = node; },
          start: () => {
            expect(source.connected).toBe(destination);
            test.started.push(source.buffer!.url);
          },
        };
        return source;
      },
    } as unknown as AudioContext;
  };
  test.sounds = new PieceSounds(FILES, make, fetchFile);
  return test;
}

export function givenAContext(): TestContext {
  return contextOf("running");
}

export function givenASuspendedContext(): TestContext {
  return contextOf("suspended");
}

export function givenAContextThatCannotBeMade(): TestContext {
  return contextOf("running", true);
}

export function givenAFileThatDoesNotLoad(sound: Sound): TestContext {
  return contextOf("running", false, { sound, when: "fetch" });
}

export function givenAFileThatDoesNotDecode(sound: Sound): TestContext {
  return contextOf("running", false, { sound, when: "decode" });
}

// Plays each sound, and after each sound waits until the loads are done, as a move comes after the sound of the move before.
export async function whenYouPlay(test: TestContext, ...sounds: Sound[]) {
  for (const sound of sounds) {
    test.sounds.play(sound);
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export function thenTheSoundsArePlayed(test: TestContext, sounds: Sound[]) {
  expect(test.started).toEqual(sounds.map((sound) => FILES[sound]));
}

export function thenBothFilesAreLoaded(test: TestContext) {
  expect([...test.fetched].sort()).toEqual(["/capture.wav", "/move.wav"]);
  expect([...test.decoded].sort()).toEqual(["/capture.wav", "/move.wav"]);
}

export function thenTheContextIsMadeOnce(test: TestContext) {
  expect(test.made).toBe(1);
}

export function thenTheContextIsResumed(test: TestContext) {
  expect(test.resumed).toBe(1);
}

export function thenThereIsSilence(test: TestContext) {
  expect(test.made).toBe(1);
  expect(test.fetched).toEqual([]);
  expect(test.started).toEqual([]);
}
