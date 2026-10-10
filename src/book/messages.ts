import { createBus, type Bus } from "../bus/bus.ts";
import type { Side } from "./side.ts";

export type AddPgn = { type: "AddPgn"; pgn: string };

export type BookCommand = AddPgn;

export type MovesAfter = { type: "MovesAfter"; side: Side; moves: string[] };

export type Summary = { type: "Summary" };

export type BookQuery = MovesAfter | Summary;

export type BookAnswers = { MovesAfter: string[]; Summary: Record<Side, number> };

export type BookBus = Bus<BookCommand, BookQuery, BookAnswers>;

export function createBookBus(): BookBus {
  return createBus<BookCommand, BookQuery, BookAnswers>();
}
