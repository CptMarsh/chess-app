import { AddPgnHandler } from "./commands/addPgnHandler.ts";
import type { LineStore } from "./lineStore.ts";
import { AddPgn, MovesAfter, Summary, type BookBus } from "./messages.ts";
import { MovesAfterHandler } from "./queries/movesAfterHandler.ts";
import { SummaryHandler } from "./queries/summaryHandler.ts";

export function attachBook(bus: BookBus, store: LineStore) {
  bus.onCommand(AddPgn, new AddPgnHandler(store));
  bus.onQuery(MovesAfter, new MovesAfterHandler(store));
  bus.onQuery(Summary, new SummaryHandler(store));
}
