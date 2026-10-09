import type { BookApi } from "../api/bookApi.ts";
import { CommandStatuses } from "../api/commandStatuses.ts";
import type { EventStore } from "./eventStore.ts";
import type { LineAdded } from "./events.ts";
import { BookMoves } from "./read/bookMoves.ts";
import { BookSummary } from "./read/bookSummary.ts";
import { BookState } from "./write/bookState.ts";
import { createProcessor } from "./write/processor.ts";
import type { Scheduler } from "./write/schedulers.ts";

export function startBookApp(eventStore: EventStore, scheduler: Scheduler): BookApi {
  const state = new BookState();
  const bookMoves = new BookMoves();
  const bookSummary = new BookSummary();
  const statuses = new CommandStatuses();

  function apply(event: LineAdded) {
    state.apply(event);
    bookMoves.apply(event);
    bookSummary.apply(event);
  }

  for (const event of eventStore.readAll()) apply(event);
  const processor = createProcessor(eventStore, state, apply, statuses, scheduler);

  return {
    sendCommand(command) {
      try {
        const commandId = crypto.randomUUID();
        statuses.record(commandId, { status: 202, body: { commandId } });
        processor.enqueue(commandId, command);
        return { status: 202, body: { commandId } };
      } catch (error) {
        return { status: 500, body: { message: String(error) } };
      }
    },
    getCommandStatus: (commandId) => statuses.get(commandId),
    getMovesAfter: (side, moves) => ({ status: 200, body: { moves: bookMoves.movesAfter(side, moves) } }),
    getSummary: () => ({ status: 200, body: { ...bookSummary.counts } }),
  };
}
