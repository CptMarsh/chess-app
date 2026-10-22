import type { QueryHandler } from "../../bus/bus.ts";
import type { LineStore } from "../lineStore.ts";
import type { MovesAfter } from "../messages.ts";
import { replay } from "./replay.ts";

export class MovesAfterHandler implements QueryHandler<MovesAfter> {
  readonly #store: Pick<LineStore, "readAll">;

  constructor(store: Pick<LineStore, "readAll">) {
    this.#store = store;
  }

  handle(query: MovesAfter) {
    const target = replay(query.moves).end;
    const next = new Set<string>();
    for (const line of this.#store.readAll()) {
      if (line.side !== query.side) continue;
      replay(line.moves).before.forEach((key, index) => {
        if (key === target) next.add(line.moves[index]);
      });
    }
    return [...next];
  }
}
