import type { BookEvent } from "../book/events.ts";
import type { EventStore } from "../book/eventStore.ts";

export function memoryEventStore(): EventStore {
  const events: BookEvent[] = [];
  return {
    append(event) {
      events.push(event);
    },
    readAll: () => events,
  };
}
