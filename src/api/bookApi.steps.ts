import { expect } from "vitest";
import { startBookApp } from "../book/bookApp.ts";
import type { EventStore } from "../book/eventStore.ts";
import type { Side } from "../book/side.ts";
import { manualScheduler, type ManualScheduler } from "../book/write/schedulers.ts";
import { memoryEventStore } from "../storage/memoryEventStore.ts";
import type { BookApi } from "./bookApi.ts";
import type { ApiResponse } from "./response.ts";

type Book = {
  api: BookApi;
  scheduler: ManualScheduler;
  commandId: string;
  response?: ApiResponse<unknown>;
};

function expectStatus(book: Book, status: number) {
  expect(book.response?.status).toBe(status);
}

function startBook(eventStore: EventStore): Book {
  const scheduler = manualScheduler();
  return { api: startBookApp(eventStore, scheduler), scheduler, commandId: "" };
}

function send(book: Book, pgn: string) {
  const response = book.api.sendCommand({ type: "AddPgn", pgn });
  book.commandId = (response.body as { commandId: string }).commandId;
  return response;
}

function addPgn(book: Book, pgn: string) {
  send(book, pgn);
  book.scheduler.run();
  return book.api.getCommandStatus(book.commandId);
}

export function givenAnEmptyBook() {
  return startBook(memoryEventStore());
}

export function givenABookWithTheWhiteLine(moves: string[]) {
  const eventStore = memoryEventStore();
  eventStore.append({ type: "LineAdded", v: 1, side: "white", moves });
  return startBook(eventStore);
}

export function givenTheCallerSentAddPgnThatHasNotRun(pgn: string) {
  const book = givenAnEmptyBook();
  send(book, pgn);
  return book;
}

export function givenTheCallerSentAddPgnThatRan(pgn: string) {
  const book = givenAnEmptyBook();
  send(book, pgn);
  book.scheduler.run();
  return book;
}

export function givenNoCommandHasTheId(commandId: string) {
  return givenAnEmptyBook();
}

export function givenTheEventStoreCannotAppend() {
  return startBook({
    append() {
      throw new Error("The event store cannot append.");
    },
    readAll: () => [],
  });
}

export function whenTheCallerAddsThePgn(book: Book, pgn: string) {
  book.response = addPgn(book, pgn);
}

export function whenTheCallerSendsAddPgn(book: Book, pgn: string) {
  book.response = send(book, pgn);
}

export function whenTheCallerAsksForTheCommandStatus(book: Book) {
  book.response = book.api.getCommandStatus(book.commandId);
}

export function whenTheCallerAsksForTheStatusOf(book: Book, commandId: string) {
  book.response = book.api.getCommandStatus(commandId);
}

export function thenTheBookGivesTheMovesAfter(book: Book, side: Side, moves: string[], expected: string[]) {
  expect(book.api.getMovesAfter(side, moves).body.moves.toSorted()).toEqual(expected.toSorted());
}

export function thenTheBookHasLines(book: Book, side: Side, count: number) {
  expect(book.api.getSummary().body[side]).toBe(count);
}

export function thenTheCommandStatusIs(book: Book, status: number) {
  expectStatus(book, status);
}

export function thenTheCommandStatusIsWithTheMessage(book: Book, status: number, message: string) {
  expect(book.response).toEqual({ status, body: { message } });
}

export function thenTheCallerGets(book: Book, status: number) {
  expectStatus(book, status);
}

export function thenTheCallerGetsAcceptedWithACommandId(book: Book) {
  expect(book.response).toEqual({ status: 202, body: { commandId: expect.any(String) } });
}
