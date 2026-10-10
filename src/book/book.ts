import { addPgn } from "./commands/addPgn.ts";
import type { LineStore } from "./lineStore.ts";
import type { BookBus } from "./messages.ts";
import { movesAfter } from "./queries/movesAfter.ts";
import { summary } from "./queries/summary.ts";

export function attachBook(bus: BookBus, store: LineStore) {
  bus.onCommand("AddPgn", addPgn(store));
  bus.onQuery("MovesAfter", movesAfter(store));
  bus.onQuery("Summary", summary(store));
}
