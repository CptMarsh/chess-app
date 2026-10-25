import type { Color } from "../line/messages.ts";

const KEY = "settings";

// The texts of the fields behind the cog, as you typed them.
export type Settings = { rating: string; color: Color; moves: string };

// The browser can block localStorage. Then the store keeps the settings only in memory.
export class SettingsStore {
  readonly #storage: () => Storage;
  #settings: Settings | null;

  constructor(storage: () => Storage) {
    this.#storage = storage;
    try {
      this.#settings = settingsOf(storage().getItem(KEY));
    } catch {
      this.#settings = null;
    }
  }

  read(): Settings | null {
    return this.#settings;
  }

  save(settings: Settings): void {
    this.#settings = { ...settings };
    try {
      this.#storage().setItem(KEY, JSON.stringify(this.#settings));
    } catch {
      // The settings stay in memory only.
    }
  }
}

function settingsOf(text: string | null): Settings | null {
  if (text === null) return null;
  try {
    const { rating, color, moves } = JSON.parse(text) as Record<string, unknown>;
    if (typeof rating !== "string" || typeof moves !== "string" || (color !== "white" && color !== "black")) return null;
    return { rating, color, moves };
  } catch {
    return null;
  }
}
