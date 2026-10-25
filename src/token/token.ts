const KEY = "lichessToken";

// The browser can block localStorage. Then the store keeps the token only in memory.
export class TokenStore {
  readonly #storage: () => Storage;
  #token: string;

  constructor(storage: () => Storage) {
    this.#storage = storage;
    try {
      this.#token = storage().getItem(KEY) ?? "";
    } catch {
      this.#token = "";
    }
  }

  read(): string {
    return this.#token;
  }

  save(text: string): void {
    const token = text.trim();
    if (token === "") throw new Error("Paste your Lichess token.");
    this.#token = token;
    try {
      this.#storage().setItem(KEY, token);
    } catch {
      // The token stays in memory only.
    }
  }
}
