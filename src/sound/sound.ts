export type Sound = "move" | "capture";

const SOUNDS: Sound[] = ["move", "capture"];

// The adapter over the Web Audio API. It plays the recorded sound files. A browser without audio, or an error, gives silence.
export class PieceSounds {
  readonly #files: Record<Sound, string>;
  readonly #makeContext: () => AudioContext;
  readonly #fetchFile: (url: string) => Promise<ArrayBuffer>;
  #context: AudioContext | null | undefined;
  readonly #buffers = new Map<Sound, Promise<AudioBuffer>>();

  constructor(
    files: Record<Sound, string>,
    makeContext: () => AudioContext = () => new AudioContext(),
    fetchFile: (url: string) => Promise<ArrayBuffer> = (url) => fetch(url).then((answer) => answer.arrayBuffer()),
  ) {
    this.#files = files;
    this.#makeContext = makeContext;
    this.#fetchFile = fetchFile;
  }

  play(sound: Sound): void {
    const context = this.#contextOrNull();
    if (context === null) return;
    if (context.state === "suspended") context.resume().catch(() => {});
    this.#bufferOf(context, sound).then((buffer) => {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(context.destination);
      source.start();
    }).catch(() => {
      // Silence.
    });
  }

  // The context is made at the first sound, after a user action, as the browser asks. Then both files start to load.
  #contextOrNull(): AudioContext | null {
    if (this.#context !== undefined) return this.#context;
    try {
      this.#context = this.#makeContext();
    } catch {
      this.#context = null;
      return null;
    }
    for (const sound of SOUNDS) this.#bufferOf(this.#context, sound).catch(() => {});
    return this.#context;
  }

  // A file that does not load or decode is not kept, so the next sound tries again.
  #bufferOf(context: AudioContext, sound: Sound): Promise<AudioBuffer> {
    let buffer = this.#buffers.get(sound);
    if (!buffer) {
      buffer = this.#fetchFile(this.#files[sound]).then((data) => context.decodeAudioData(data));
      buffer.catch(() => this.#buffers.delete(sound));
      this.#buffers.set(sound, buffer);
    }
    return buffer;
  }
}
