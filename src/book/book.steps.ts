import { expect } from "vitest";
import type { Ack } from "../bus/bus.ts";
import { memoryLineStore } from "../storage/memoryLineStore.ts";
import { attachBook } from "./book.ts";
import type { LineStore } from "./lineStore.ts";
import { createBookBus, type BookBus } from "./messages.ts";
import type { Side } from "./side.ts";

type Book = { bus: BookBus; ack?: Ack; error?: unknown; moves?: string[] };

function startBook(store: LineStore): Book {
  const bus = createBookBus();
  attachBook(bus, store);
  return { bus };
}

export function givenAnEmptyBook() {
  return startBook(memoryLineStore());
}

export function givenABookWithTheWhiteLine(moves: string[]) {
  const store = memoryLineStore();
  store.add({ side: "white", moves });
  return startBook(store);
}

export function givenTheLineStoreCannotAdd() {
  return startBook({
    add() {
      throw new Error("The line store cannot add.");
    },
    readAll: () => [],
  });
}

export function whenTheCallerAddsThePgn(book: Book, pgn: string) {
  try {
    whenTheCallerSendsAddPgn(book, pgn);
  } catch (error) {
    book.error = error;
  }
}

export function whenTheCallerSendsAddPgn(book: Book, pgn: string) {
  book.ack = book.bus.send({ type: "AddPgn", pgn });
}

export function whenTheCallerSendsAddPgnAndAsksForTheMovesAfter(book: Book, pgn: string, side: Side, moves: string[]) {
  whenTheCallerSendsAddPgn(book, pgn);
  book.moves = book.bus.ask({ type: "MovesAfter", side, moves });
}

export function thenTheBookGivesTheMovesAfter(book: Book, side: Side, moves: string[], expected: string[]) {
  expect(new Set(book.bus.ask({ type: "MovesAfter", side, moves }))).toEqual(new Set(expected));
}

export function thenTheBookGives(book: Book, expected: string[]) {
  expect(book.moves).toEqual(expected);
}

export function thenTheBookHasLines(book: Book, side: Side, count: number) {
  expect(book.bus.ask({ type: "Summary" })).toEqual(expect.objectContaining({ [side]: count }));
}

export function thenTheCallerGetsACommandId(book: Book) {
  expect(book.ack).toEqual({ commandId: expect.stringMatching(/.+/) });
}

export function thenTheCallerGetsTheError(book: Book, message: string) {
  expect(book.error).toEqual(new Error(message));
}
