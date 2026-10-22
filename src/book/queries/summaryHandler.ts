import type { QueryHandler } from "../../bus/bus.ts";
import type { LineStore } from "../lineStore.ts";
import type { Summary } from "../messages.ts";
import { bySide } from "../side.ts";

export class SummaryHandler implements QueryHandler<Summary> {
  readonly #store: Pick<LineStore, "readAll">;

  constructor(store: Pick<LineStore, "readAll">) {
    this.#store = store;
  }

  handle() {
    const counts = bySide(() => 0);
    for (const line of this.#store.readAll()) counts[line.side] += 1;
    return counts;
  }
}
