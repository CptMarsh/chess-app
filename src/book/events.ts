import type { Side } from "./side.ts";

export type LineAdded = { type: "LineAdded"; v: 1; side: Side; moves: string[] };

export type BookEvent = LineAdded;
