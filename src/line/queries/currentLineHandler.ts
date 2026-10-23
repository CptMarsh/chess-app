import type { QueryHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { CurrentLine } from "../messages.ts";

export class CurrentLineHandler implements QueryHandler<CurrentLine> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle() {
    const { chess, status, message, arrow } = this.#state;
    const legalMoves = new Map<string, string[]>();
    if (status === "yourMove") {
      for (const move of chess.moves({ verbose: true })) {
        legalMoves.set(move.from, [...(legalMoves.get(move.from) ?? []), move.to]);
      }
    }
    return { fen: chess.fen(), moves: chess.history(), status, message, arrow, legalMoves };
  }
}
