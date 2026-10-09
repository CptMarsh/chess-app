import type { BookApi } from "../api/bookApi.ts";
import type { EventStore } from "./eventStore.ts";
import type { Scheduler } from "./write/schedulers.ts";

export function startBookApp(eventStore: EventStore, scheduler: Scheduler): BookApi {
  return {
    sendCommand: () => ({ status: 501, body: { message: "Not Implemented" } }),
    getCommandStatus: () => ({ status: 501, body: { message: "Not Implemented" } }),
    getMovesAfter: () => ({ status: 501, body: { moves: [] } }),
    getSummary: () => ({ status: 501, body: { white: 0, black: 0 } }),
  };
}
