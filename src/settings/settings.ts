import type { Color } from "../line/messages.ts";

const SOURCE = "replySource";
const USERNAME = "chessComUsername";
const SOUND = "pieceSound";
const LINE = "lineSettings";

export type Source = "lichess" | "chessCom";

// The texts of the Rating, Color and Moves fields, as you typed them.
export type LineSettings = { rating: string; color: Color; moves: string };

// The browser can block localStorage. Then the store keeps the settings only in memory.
export class SettingsStore {
  readonly #storage: () => Storage;
  #source: Source = "lichess";
  #username = "";
  #sound = true;
  #line: LineSettings | null = null;

  constructor(storage: () => Storage) {
    this.#storage = storage;
    try {
      if (storage().getItem(SOURCE) === "chessCom") this.#source = "chessCom";
      this.#username = storage().getItem(USERNAME) ?? "";
      this.#sound = storage().getItem(SOUND) !== "off";
      this.#line = lineOf(storage().getItem(LINE));
    } catch {
      // The defaults stay.
    }
  }

  source(): Source {
    return this.#source;
  }

  username(): string {
    return this.#username;
  }

  line(): LineSettings | null {
    return this.#line;
  }

  sound(): boolean {
    return this.#sound;
  }

  save(source: Source, username: string): void {
    this.#source = source;
    this.#username = username.trim();
    try {
      this.#storage().setItem(SOURCE, this.#source);
      this.#storage().setItem(USERNAME, this.#username);
    } catch {
      // The settings stay in memory only.
    }
  }

  saveSound(on: boolean): void {
    this.#sound = on;
    try {
      this.#storage().setItem(SOUND, on ? "on" : "off");
    } catch {
      // The sound setting stays in memory only.
    }
  }

  saveLine(line: LineSettings): void {
    this.#line = { ...line };
    try {
      this.#storage().setItem(LINE, JSON.stringify(this.#line));
    } catch {
      // The line settings stay in memory only.
    }
  }
}

function lineOf(text: string | null): LineSettings | null {
  if (text === null) return null;
  try {
    const { rating, color, moves } = JSON.parse(text) as Record<string, unknown>;
    if (typeof rating !== "string" || typeof moves !== "string" || (color !== "white" && color !== "black")) return null;
    return { rating, color, moves };
  } catch {
    return null;
  }
}
