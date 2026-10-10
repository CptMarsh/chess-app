import type { LineStore } from "../lineStore.ts";
import { bySide } from "../side.ts";

export function summary(store: Pick<LineStore, "readAll">) {
  return () => {
    const counts = bySide(() => 0);
    for (const line of store.readAll()) counts[line.side] += 1;
    return counts;
  };
}
