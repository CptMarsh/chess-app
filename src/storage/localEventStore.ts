import type { EventStore } from "../book/eventStore.ts";
import type { BookEvent } from "../book/events.ts";

const key = "chess-app.events.v1";

export function localEventStore(): EventStore {
  function readAll(): BookEvent[] {
    return JSON.parse(localStorage.getItem(key) ?? "[]");
  }

  return {
    append(event) {
      localStorage.setItem(key, JSON.stringify([...readAll(), event]));
    },
    readAll,
  };
}
