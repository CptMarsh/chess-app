import type { Reply } from "../line/messages.ts";
import type { Source } from "../settings/settings.ts";

type Explorer = { replies(fen: string, rating: number): Promise<Reply[]> };

// Sends each request to the explorer of the source that is chosen at that moment.
export class SourceExplorer {
  readonly #source: () => Source;
  readonly #explorers: Record<Source, Explorer>;

  constructor(source: () => Source, lichess: Explorer, chessCom: Explorer) {
    this.#source = source;
    this.#explorers = { lichess, chessCom };
  }

  replies(fen: string, rating: number): Promise<Reply[]> {
    return this.#explorers[this.#source()].replies(fen, rating);
  }
}
