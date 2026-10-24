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
    const state = this.#state;
    const acceptable = state.acceptable.find((candidate) => candidate.move.slice(0, 4) === command.move.slice(0, 4));
    const move = state.status === "tryAgain" ? acceptable!.move : command.move;
    state.chess.move(uciMove(move));
    state.percents.push(null);
    state.evals.push(null);
    state.yourMoves += 1;
    state.message = "";
    state.arrows = [];
    if (state.status === "tryAgain") {
      state.eval = state.toWhiteSide(acceptable!.score);
      state.acceptable = [];
      state.afterYourMove();
    } else {
      state.status = state.yourMoves === 1 ? "waitingForReply" : "checkingYourMove";
    }
  }
}
