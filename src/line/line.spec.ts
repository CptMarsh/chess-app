import { test } from "vitest";
import {
  givenALineAfter,
  givenANewLine,
  givenNoLine,
  thenTheLegalMovesFrom,
  thenTheLineIs,
  thenThereAreNoLegalMoves,
  thenYouGetTheError,
  whenTheEngineGives,
  whenTheLineStops,
  whenTheReplyIsPickedFrom,
  whenYouPlay,
  whenYouStartALine,
} from "./line.steps.ts";

const E5 = { uci: "e7e5", san: "e5", games: 30 };
const C5 = { uci: "c7c5", san: "c5", games: 10 };
const verdict = (bestMove: string, bestScore: number, yourScore: number) => ({ bestMove, bestScore, yourScore });
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

test("A later move waits for the judgement", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "g1f3");
  thenTheLineIs(line, { moves: ["e4", "e5", "Nf3"], status: "checkingYourMove" });
  thenThereAreNoLegalMoves(line);
});

test("The best move gets 'Best move.'", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, verdict("g1f3", 30, 30));
  thenTheLineIs(line, { moves: ["e4", "e5", "Nf3"], status: "waitingForReply", message: "Best move.", arrow: null });
});

test("A move that loses 20 centipawns or less stays", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "b1c3");
  whenTheEngineGives(line, verdict("g1f3", 30, 10));
  thenTheLineIs(line, { moves: ["e4", "e5", "Nc3"], message: "Good. The best move was Nf3.", arrow: null });
});

test("A move that loses more than 20 centipawns is replaced", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, verdict("g1f3", 30, -250));
  thenTheLineIs(line, {
    moves: ["e4", "e5", "Nf3"], status: "waitingForReply",
    message: "Ba6 loses 2.8 pawns. The best move is Nf3.", arrow: { from: "g1", to: "f3" },
  });
});

test("The message and the arrow stay after the reply", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, verdict("g1f3", 30, -250));
  whenTheReplyIsPickedFrom(line, [{ uci: "b8c6", san: "Nc6", games: 1 }]);
  thenTheLineIs(line, {
    status: "yourMove",
    message: "Ba6 loses 2.8 pawns. The best move is Nf3.", arrow: { from: "g1", to: "f3" },
  });
});

test("A move that allows mate is replaced", () => {
  const line = givenALineAfter(["f2f3", "e7e5"]);
  whenYouPlay(line, "g2g4");
  whenTheEngineGives(line, verdict("e2e4", -50, -10000));
  thenTheLineIs(line, { moves: ["f3", "e5", "e4"], message: "g4 allows mate. The best move is e4.", arrow: { from: "e2", to: "e4" } });
});

test("A move that misses a mate is replaced, and the mate ends the line", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6"]);
  whenYouPlay(line, "d2d3");
  whenTheEngineGives(line, verdict("h5f7", 10000, 300));
  thenTheLineIs(line, { status: "ended", message: "d3 misses a mate. The best move is Qxf7#. Checkmate.", arrow: { from: "h5", to: "f7" } });
});

test("Castling is compared as e1g1", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6"]);
  whenYouPlay(line, "e1g1");
  whenTheEngineGives(line, verdict("e1g1", 30, 30));
  thenTheLineIs(line, { message: "Best move." });
});

test("The line ends after your fifth move, and a promotion is compared with its piece", () => {
  const line = givenALineAfter(["e2e4", "d7d5", "e4d5", "c7c6", "d5c6", "g8f6", "c6b7", "b8c6"]);
  whenYouPlay(line, "b7a8q");
  whenTheEngineGives(line, verdict("b7a8q", 900, 900));
  thenTheLineIs(line, { status: "ended", message: "Best move." });
});
