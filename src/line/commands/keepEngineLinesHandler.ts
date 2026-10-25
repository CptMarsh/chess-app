import { Chess } from "chess.js";
import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { KeepEngineLines } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

export class KeepEngineLinesHandler implements CommandHandler<KeepEngineLines> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: KeepEngineLines) {
    const node = this.#state.nodes.get(command.at);
    if (!node) return;
    const whiteToMove = node.fen.split(" ")[1] === "w";
    node.lines = command.candidates.map(({ score, line }) => {
      const chess = new Chess(node.fen);
      return { eval: whiteToMove ? score : -score, sans: line.map((move) => chess.move(uciMove(move)).san) };
    });
  }
}
