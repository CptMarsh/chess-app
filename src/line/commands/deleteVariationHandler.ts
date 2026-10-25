import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { DeleteVariation } from "../messages.ts";

export class DeleteVariationHandler implements CommandHandler<DeleteVariation> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: DeleteVariation) {
    const node = this.#state.nodes.get(command.at);
    if (!node || node.main) return;
    this.#state.remove(node.id);
  }
}
