import type { BookEvent } from "./events.ts";

export type Projection = { apply(event: BookEvent): void };
