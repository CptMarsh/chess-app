import type { QueryHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { CurrentLine } from "../messages.ts";

export class CurrentLineHandler implements QueryHandler<CurrentLine> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle() {
    const { chess, color, status, message, arrows, acceptable, percents, evals } = this.#state;
    const legalMoves = new Map<string, string[]>();
    const add = (from: string, to: string) => legalMoves.set(from, [...(legalMoves.get(from) ?? []), to]);
    if (status === "yourMove") {
      for (const move of chess.moves({ verbose: true })) add(move.from, move.to);
    } else if (status === "tryAgain") {
      for (const { move } of acceptable) add(move.slice(0, 2), move.slice(2, 4));
    }
    return { fen: chess.fen(), color, moves: chess.history({ verbose: true }).map(({ san, after }, index) => ({ san, percent: percents[index], fen: after, eval: evals[index + 1] })), status, message, arrows: [...arrows], eval: this.#state.eval, startEval: evals[0], accuracy: { ...this.#state.accuracy }, legalMoves };
  }
}
