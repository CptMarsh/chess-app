import { Chess } from "chess.js";
import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { StartLine } from "../messages.ts";

export class StartLineHandler implements CommandHandler<StartLine> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: StartLine) {
    if (!Number.isInteger(command.rating) || command.rating < 0) {
      throw new Error("The rating must be a whole number, 0 or more.");
    }
    if (!Number.isInteger(command.moves) || command.moves < 2) {
      throw new Error("The number of moves must be a whole number, 2 or more.");
    }
    this.#state.chess = new Chess();
    this.#state.lineLength = command.moves;
    this.#state.color = command.color;
    this.#state.status = command.color === "white" ? "checkingPosition" : "waitingForReply";
    this.#state.message = "";
    this.#state.arrows = [];
    this.#state.acceptable = [];
    this.#state.yourMoves = 0;
    this.#state.newTree();
    this.#state.accuracy = { correct: 0, checked: 0 };
  }
}
