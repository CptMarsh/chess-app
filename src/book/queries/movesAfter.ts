import type { LineStore } from "../lineStore.ts";
import type { MovesAfter } from "../messages.ts";
import { replay } from "./replay.ts";

export function movesAfter(store: Pick<LineStore, "readAll">) {
  return (query: MovesAfter) => {
    const target = replay(query.moves).end;
    const next = new Set<string>();
    for (const line of store.readAll()) {
      if (line.side !== query.side) continue;
      replay(line.moves).before.forEach((key, index) => {
        if (key === target) next.add(line.moves[index]);
      });
    }
    return [...next];
  };
}
