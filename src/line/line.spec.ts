import { test } from "vitest";
import {
  givenANewLine,
  givenNoLine,
  thenTheLegalMovesFrom,
  thenTheLineIs,
  thenThereAreNoLegalMoves,
  thenYouGetTheError,
  whenTheLineStops,
  whenTheReplyIsPickedFrom,
  whenYouPlay,
  whenYouStartALine,
} from "./line.steps.ts";

const E5 = { uci: "e7e5", san: "e5", games: 30 };
const C5 = { uci: "c7c5", san: "c5", games: 10 };
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

test("Before the first line, the board is locked", () => {
  const line = givenNoLine();
  thenTheLineIs(line, { fen: START, moves: [], status: "ended", message: "", arrow: null });
  thenThereAreNoLegalMoves(line);
});

test("A new line starts at the start position", () => {
  const line = givenANewLine(1450);
  thenTheLineIs(line, { fen: START, moves: [], status: "yourMove", message: "", arrow: null });
  thenTheLegalMovesFrom(line, "e2", ["e3", "e4"]);
});

test.each([-1, 1450.5, Number.NaN])("The rating %s is rejected", (rating) => {
  const line = givenNoLine();
  whenYouStartALine(line, rating);
  thenYouGetTheError(line, "The rating must be a whole number, 0 or more.");
  thenTheLineIs(line, { status: "ended" });
});

test("Your first move waits for the reply without a judgement", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  thenTheLineIs(line, { moves: ["e4"], status: "waitingForReply" });
  thenThereAreNoLegalMoves(line);
});

test("The random number 0.74 picks the first of 30 and 10 games", () => {
  const line = givenANewLine(1450, 0.74);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheLineIs(line, { moves: ["e4", "e5"], status: "yourMove" });
});

test("The random number 0.76 picks the second of 30 and 10 games", () => {
  const line = givenANewLine(1450, 0.76);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheLineIs(line, { moves: ["e4", "c5"], status: "yourMove" });
});

test("No replies ends the line", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, []);
  thenTheLineIs(line, { status: "ended", message: "No games at your level after this position." });
});

test("StopLine ends the line with its message", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  whenTheLineStops(line, "Lichess did not answer (status 503).");
  thenTheLineIs(line, { status: "ended", message: "Lichess did not answer (status 503)." });
  thenThereAreNoLegalMoves(line);
});
