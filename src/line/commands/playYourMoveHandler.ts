import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { PlayYourMove } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

export class PlayYourMoveHandler implements CommandHandler<PlayYourMove> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: PlayYourMove) {
    const { move } = command;
    this.#state.chess.move(uciMove(move));
    this.#state.percents.push(null);
    this.#state.yourMoves += 1;
    this.#state.message = "";
    this.#state.arrow = null;
    this.#state.eval = null;
    this.#state.status = this.#state.yourMoves === 1 ? "waitingForReply" : "checkingYourMove";
  }
}
