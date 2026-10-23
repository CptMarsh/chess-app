import { test } from "vitest";
import {
  givenANewLine,
  givenNoLine,
  thenTheLegalMovesFrom,
  thenTheLineIs,
  thenThereAreNoLegalMoves,
  thenYouGetTheError,
  whenYouPlay,
  whenYouStartALine,
} from "./line.steps.ts";

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
