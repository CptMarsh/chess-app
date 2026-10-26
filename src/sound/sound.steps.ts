import { expect } from "vitest";
import { PieceSounds, pieceSamples, type Sound } from "./sound.ts";

const RATE = 48000;

type FakeBuffer = { samples: Float32Array | null };
type TestContext = {
  sounds: PieceSounds;
  made: number;
  buffers: FakeBuffer[];
  started: FakeBuffer[];
  resumed: number;
};

function contextOf(state: AudioContextState, cannotBeMade = false): TestContext {
  const test: TestContext = { sounds: undefined!, made: 0, buffers: [], started: [], resumed: 0 };
  const make = () => {
    test.made += 1;
    if (cannotBeMade) throw new DOMException("No audio.", "NotSupportedError");
    const destination = {};
    return {
      state,
      sampleRate: RATE,
      destination,
      resume: () => {
        test.resumed += 1;
        return Promise.reject(new DOMException("Not allowed.", "NotAllowedError"));
      },
      createBuffer: (channels: number, length: number, rate: number) => {
        expect([channels, rate]).toEqual([1, RATE]);
        const buffer: FakeBuffer & { copyToChannel: (samples: Float32Array, channel: number) => void } = {
          samples: null,
          copyToChannel: (samples, channel) => {
            expect([channel, samples.length]).toEqual([0, length]);
            buffer.samples = samples;
          },
        };
        test.buffers.push(buffer);
        return buffer;
      },
      createBufferSource: () => {
        const source = {
          buffer: null as FakeBuffer | null,
          connected: null as unknown,
          connect: (node: unknown) => { source.connected = node; },
          start: () => {
            expect(source.connected).toBe(destination);
            test.started.push(source.buffer!);
          },
        };
        return source;
      },
    } as unknown as AudioContext;
  };
  test.sounds = new PieceSounds(make);
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

export function whenYouPlay(test: TestContext, ...sounds: Sound[]) {
  for (const sound of sounds) test.sounds.play(sound);
}

export function thenTheSoundsArePlayed(test: TestContext, sounds: Sound[]) {
  expect(test.started.map(({ samples }) => samples)).toEqual(sounds.map((sound) => pieceSamples(sound, RATE)));
}

export function thenTheContextIsMadeOnce(test: TestContext, buffers: number) {
  expect(test.made).toBe(1);
  expect(test.buffers).toHaveLength(buffers);
}

export function thenTheContextIsResumed(test: TestContext) {
  expect(test.resumed).toBe(1);
}

export function thenThereIsSilence(test: TestContext) {
  expect(test.made).toBe(1);
  expect(test.started).toEqual([]);
}

function peak(samples: Float32Array): number {
  return samples.reduce((top, sample) => Math.max(top, Math.abs(sample)), 0);
}

export function thenTheSamplesAre(sound: Sound, sampleRate: number, length: number) {
  const samples = pieceSamples(sound, sampleRate);
  expect(samples).toHaveLength(length);
  expect(peak(samples)).toBeLessThanOrEqual(1);
  expect(peak(samples)).toBeGreaterThan(0.1);
  expect(Math.abs(samples.at(-1)!)).toBeLessThan(0.01);
}

export function thenTheCaptureIsLouder() {
  expect(peak(pieceSamples("capture", RATE))).toBeGreaterThan(peak(pieceSamples("move", RATE)));
}

export function thenTheSamplesAreTheSame() {
  expect(pieceSamples("capture", RATE)).toEqual(pieceSamples("capture", RATE));
}
