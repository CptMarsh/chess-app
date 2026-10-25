const SOURCE = "replySource";
const USERNAME = "chessComUsername";

export type Source = "lichess" | "chessCom";

// The browser can block localStorage. Then the store keeps the settings only in memory.
export class SettingsStore {
  readonly #storage: () => Storage;
  #source: Source = "lichess";
  #username = "";

  constructor(storage: () => Storage) {
    this.#storage = storage;
    try {
      if (storage().getItem(SOURCE) === "chessCom") this.#source = "chessCom";
      this.#username = storage().getItem(USERNAME) ?? "";
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
}
