import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { JudgeVariationPosition } from "../messages.ts";

export class JudgeVariationPositionHandler implements CommandHandler<JudgeVariationPosition> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: JudgeVariationPosition) {
    const node = this.#state.nodes.get(command.at);
    if (!node) return;
    node.eval = node.fen.split(" ")[1] === "w" ? command.score : -command.score;
  }
}
