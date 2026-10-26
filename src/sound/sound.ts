export type Sound = "move" | "capture";

type Knock = { at: number; high: number; low: number; gain: number };

// The length in seconds and the knocks of wood of each sound. The pitch of a knock falls from high to low.
const SOUNDS: Record<Sound, { length: number; knocks: Knock[] }> = {
  move: { length: 0.08, knocks: [{ at: 0, high: 900, low: 500, gain: 0.5 }] },
  capture: { length: 0.14, knocks: [{ at: 0, high: 700, low: 300, gain: 0.8 }, { at: 0.04, high: 700, low: 300, gain: 0.5 }] },
};
const TONE_DECAY = 0.015;
const PITCH_DECAY = 0.02;
const CLICK_DECAY = 0.003;
const CLICK_GAIN = 0.4;
const SEED = 12345;

export function pieceSamples(sound: Sound, sampleRate: number): Float32Array<ArrayBuffer> {
  const { length, knocks } = SOUNDS[sound];
  const samples = new Float32Array(Math.round(length * sampleRate));
  let seed = SEED;
  const noise = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
  };
  for (const { at, high, low, gain } of knocks) {
    let phase = 0;
    for (let index = Math.round(at * sampleRate); index < samples.length; index += 1) {
      const time = index / sampleRate - at;
      phase += 2 * Math.PI * (low + (high - low) * Math.exp(-time / PITCH_DECAY)) / sampleRate;
      samples[index] += gain * (Math.exp(-time / TONE_DECAY) * Math.sin(phase) + CLICK_GAIN * Math.exp(-time / CLICK_DECAY) * noise());
    }
  }
  // The sound fades out to 0 at the end.
  return samples.map((sample, index) => Math.max(-1, Math.min(1, sample * (1 - index / samples.length))));
}

// The adapter over the Web Audio API. A browser without audio, or an error, gives silence.
export class PieceSounds {
  readonly #makeContext: () => AudioContext;
  #context: AudioContext | null | undefined;
  readonly #buffers = new Map<Sound, AudioBuffer>();

  constructor(makeContext: () => AudioContext = () => new AudioContext()) {
    this.#makeContext = makeContext;
  }

  play(sound: Sound): void {
    try {
      const context = this.#contextOrNull();
      if (context === null) return;
      if (context.state === "suspended") context.resume().catch(() => {});
      const source = context.createBufferSource();
      source.buffer = this.#bufferOf(context, sound);
      source.connect(context.destination);
      source.start();
    } catch {
      // Silence.
    }
  }

  // The context is made at the first sound, after a user action, as the browser asks.
  #contextOrNull(): AudioContext | null {
    if (this.#context === undefined) {
      try {
        this.#context = this.#makeContext();
      } catch {
        this.#context = null;
      }
    }
    return this.#context;
  }

  #bufferOf(context: AudioContext, sound: Sound): AudioBuffer {
    let buffer = this.#buffers.get(sound);
    if (!buffer) {
      const samples = pieceSamples(sound, context.sampleRate);
      buffer = context.createBuffer(1, samples.length, context.sampleRate);
      buffer.copyToChannel(samples, 0);
      this.#buffers.set(sound, buffer);
    }
    return buffer;
  }
}
