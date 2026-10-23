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
    this.#state.chess = new Chess();
    this.#state.status = "yourMove";
    this.#state.message = "";
    this.#state.arrow = null;
    this.#state.yourMoves = 0;
  }
}
