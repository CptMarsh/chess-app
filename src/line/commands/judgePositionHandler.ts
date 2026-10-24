import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { JudgePosition } from "../messages.ts";

export class JudgePositionHandler implements CommandHandler<JudgePosition> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: JudgePosition) {
    this.#state.eval = this.#state.toWhiteSide(command.score);
    this.#state.status = "yourMove";
  }
}
