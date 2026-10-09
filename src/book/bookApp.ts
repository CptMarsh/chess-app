import { createBookApi, type BookApi } from "../api/bookApi.ts";
import { CommandStatuses } from "../api/commandStatuses.ts";
import type { EventStore } from "./eventStore.ts";
import type { BookEvent } from "./events.ts";
import type { Projection } from "./projection.ts";
import { BookMoves } from "./read/bookMoves.ts";
import { BookSummary } from "./read/bookSummary.ts";
import { BookState } from "./write/bookState.ts";
import { createProcessor } from "./write/processor.ts";
import type { Scheduler } from "./write/schedulers.ts";

export function startBookApp(eventStore: EventStore, scheduler: Scheduler): BookApi {
  const state = new BookState();
  const bookMoves = new BookMoves();
  const bookSummary = new BookSummary();
  const projections: Projection[] = [state, bookMoves, bookSummary];

  function apply(event: BookEvent) {
    for (const projection of projections) projection.apply(event);
  }

  for (const event of eventStore.readAll()) apply(event);
  const statuses = new CommandStatuses();
  const processor = createProcessor({
    eventStore,
    state,
    apply,
    report: (commandId, outcome) => statuses.report(commandId, outcome),
    scheduler,
  });
  return createBookApi({ processor, statuses, bookMoves, bookSummary });
}
