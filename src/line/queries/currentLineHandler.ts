import type { QueryHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { CurrentLine, MoveNode } from "../messages.ts";

export class CurrentLineHandler implements QueryHandler<CurrentLine> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle() {
    const { chess, color, status, message, arrows, acceptable, root, current } = this.#state;
    const legalMoves = new Map<string, string[]>();
    const add = (from: string, to: string) => legalMoves.set(from, [...(legalMoves.get(from) ?? []), to]);
    if (status === "yourMove") {
      for (const move of chess.moves({ verbose: true })) add(move.from, move.to);
    } else if (status === "tryAgain") {
      for (const { move } of acceptable) add(move.slice(0, 2), move.slice(2, 4));
    }
    return { fen: chess.fen(), color, nodes: this.#nodesFrom(root), current, status, message, arrows: [...arrows], eval: this.#state.eval, accuracy: { ...this.#state.accuracy }, legalMoves };
  }

  #nodesFrom(id: number): MoveNode[] {
    const { children, ...node } = this.#state.nodes.get(id)!;
    return [node, ...children.flatMap((child) => this.#nodesFrom(child))];
  }
}
