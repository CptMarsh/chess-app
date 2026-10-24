import type { QueryHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { CurrentLine } from "../messages.ts";

export class CurrentLineHandler implements QueryHandler<CurrentLine> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle() {
    const { chess, color, status, message, arrow, percents } = this.#state;
    const legalMoves = new Map<string, string[]>();
    if (status === "yourMove") {
      for (const move of chess.moves({ verbose: true })) {
        legalMoves.set(move.from, [...(legalMoves.get(move.from) ?? []), move.to]);
      }
    }
    return { fen: chess.fen(), color, moves: chess.history().map((san, index) => ({ san, percent: percents[index] })), status, message, arrow, eval: this.#state.eval, accuracy: { ...this.#state.accuracy }, legalMoves };
  }
}
