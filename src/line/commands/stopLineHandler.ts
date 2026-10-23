import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { StopLine } from "../messages.ts";

export class StopLineHandler implements CommandHandler<StopLine> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: StopLine) {
    this.#state.end(command.message);
  }
}
