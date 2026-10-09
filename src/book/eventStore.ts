import type { BookEvent } from "./events.ts";

export type EventStore = {
  append(event: BookEvent): void;
  readAll(): BookEvent[];
};
