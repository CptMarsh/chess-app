import { test } from "vitest";
import {
  givenABookWithTheWhiteLine,
  givenAnEmptyBook,
  givenNoCommandHasTheId,
  givenTheCallerSentAddPgnThatHasNotRun,
  givenTheCallerSentAddPgnThatRan,
  givenTheEventStoreCannotAppend,
  thenTheBookGivesTheMovesAfter,
  thenTheBookHasLines,
  thenTheCallerGets,
  thenTheCallerGetsAcceptedWithACommandId,
  thenTheCommandStatusIs,
  thenTheCommandStatusIsWithTheMessage,
  whenTheCallerAddsThePgn,
  whenTheCallerAsksForTheCommandStatus,
  whenTheCallerAsksForTheStatusOf,
  whenTheCallerSendsAddPgn,
} from "./bookApi.steps.ts";

test("The book gives the next move of a line", () => {
  const book = givenAnEmptyBook();
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. e4 e5 2. Nf3 Nc6');
  thenTheBookGivesTheMovesAfter(book, "white", ["e4", "e5"], ["Nf3"]);
});

test("Two lines with the same start give both moves", () => {
  const book = givenABookWithTheWhiteLine(["e4", "e5", "Nf3"]);
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. e4 c5 2. Nf3');
  thenTheBookGivesTheMovesAfter(book, "white", ["e4"], ["e5", "c5"]);
});

test("Transposed lines share one position", () => {
  const book = givenABookWithTheWhiteLine(["d4", "Nf6", "c4", "e6", "Nc3"]);
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. c4 e6 2. d4 Nf6 3. Nf3');
  thenTheBookGivesTheMovesAfter(book, "white", ["c4", "e6", "d4", "Nf6"], ["Nc3", "Nf3"]);
});

test("A duplicate line is rejected with 409", () => {
  const book = givenABookWithTheWhiteLine(["e4", "e5"]);
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. e4 e5');
  thenTheCommandStatusIsWithTheMessage(book, 409, "The White book already has this line.");
  thenTheBookHasLines(book, "white", 1);
});

test("White and Black lines stay separate", () => {
  const book = givenABookWithTheWhiteLine(["e4", "e5", "Nf3"]);
  whenTheCallerAddsThePgn(book, '[Orientation "black"] 1. e4 e5 2. Bc4');
  thenTheBookGivesTheMovesAfter(book, "white", ["e4", "e5"], ["Nf3"]);
  thenTheBookGivesTheMovesAfter(book, "black", ["e4", "e5"], ["Bc4"]);
});

test("One side can have two moves in one position", () => {
  const book = givenABookWithTheWhiteLine(["e4", "e5", "Nf3"]);
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. e4 e5 2. Bc4');
  thenTheBookGivesTheMovesAfter(book, "white", ["e4", "e5"], ["Nf3", "Bc4"]);
});

test("The side header ignores letter case", () => {
  const book = givenAnEmptyBook();
  whenTheCallerAddsThePgn(book, '[Orientation "Black"] 1. d4 d5');
  thenTheBookHasLines(book, "black", 1);
});

test("A PGN without a side is rejected with 422", () => {
  const book = givenAnEmptyBook();
  whenTheCallerAddsThePgn(book, "1. e4 e5");
  thenTheCommandStatusIsWithTheMessage(book, 422, 'Add [Orientation "white"] or [Orientation "black"] to the PGN.');
});

test("Comments and NAGs do not change the moves", () => {
  const book = givenAnEmptyBook();
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. e4 {main line} e5!? 2. Nf3 $1 Nc6');
  thenTheBookGivesTheMovesAfter(book, "white", ["e4", "e5", "Nf3"], ["Nc6"]);
});

test("Other headers and Windows line ends do not change the moves", () => {
  const book = givenAnEmptyBook();
  whenTheCallerAddsThePgn(book, '[Event "Repertoire"]\r\n[Orientation "white"]\r\n\r\n1. e4 e5 *');
  thenTheBookGivesTheMovesAfter(book, "white", ["e4"], ["e5"]);
});

test("A command is acknowledged with 202 and an id", () => {
  const book = givenAnEmptyBook();
  whenTheCallerSendsAddPgn(book, '[Orientation "white"] 1. e4 e5');
  thenTheCallerGetsAcceptedWithACommandId(book);
});

test("A command that has not run stays at 202", () => {
  const book = givenTheCallerSentAddPgnThatHasNotRun('[Orientation "white"] 1. e4 e5');
  whenTheCallerAsksForTheCommandStatus(book);
  thenTheCallerGets(book, 202);
});

test("An added line gives 201", () => {
  const book = givenTheCallerSentAddPgnThatRan('[Orientation "white"] 1. e4 e5');
  whenTheCallerAsksForTheCommandStatus(book);
  thenTheCallerGets(book, 201);
});

test("An unknown command id gives 404", () => {
  const book = givenNoCommandHasTheId("abc");
  whenTheCallerAsksForTheStatusOf(book, "abc");
  thenTheCallerGets(book, 404);
});

test("A failed event store gives 500 and adds nothing", () => {
  const book = givenTheEventStoreCannotAppend();
  whenTheCallerAddsThePgn(book, '[Orientation "white"] 1. e4 e5');
  thenTheCommandStatusIs(book, 500);
  thenTheBookHasLines(book, "white", 0);
});
