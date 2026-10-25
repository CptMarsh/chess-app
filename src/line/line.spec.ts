import { test } from "vitest";
import {
  currentOf,
  idOf,
  idsOf,
  thenTheChildrenAre,
  thenTheCurrentNodeIsTheLastMainNode,
    thenTheExploreMovesFrom,
  thenTheIdsAreNew,
  thenTheNodeCountIs,
  thenTheNodeIs,
  thenTheParentsComeFirst,
  thenTheVariationLineIs,
  thenThereAreNoExploreMoves,
  thenThereIsNoNode,
  whenTheEngineExaminesTheVariation,
  whenTheEngineGivesTheLines,
  whenYouDelete,
  whenYouExplore,
  givenALineAfter,
  givenANewLine,
  givenNoLine,
  thenTheEvalsAre,
  thenTheFenAfterMoveIs,
  thenTheLegalMovesAre,
  thenTheLegalMovesFrom,
  thenTheLineThrew,
  thenTheLineIs,
  thenTheMovesAre,
  thenThereAreNoLegalMoves,
  thenYouGetTheError,
  whenTheEngineExamines,
  whenTheEngineGives,
  whenTheEngineGivesAVerdictThatThrows,
  whenTheLineStops,
  whenTheReplyIsPickedFrom,
  whenYouPlay,
  whenYouStartALine,
} from "./line.steps.ts";

const E5 = { uci: "e7e5", san: "e5", games: 30, percent: 42 };
const C5 = { uci: "c7c5", san: "c5", games: 10, percent: 14 };
const verdict = (bestMove: string, bestScore: number, yourScore: number) => ({ candidates: [{ move: bestMove, score: bestScore, line: [bestMove] }], yourScore, yourLine: [bestMove] });
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

test("Before the first line, the board is locked", () => {
  const line = givenNoLine();
  thenTheLineIs(line, { fen: START, moves: [], status: "ended", color: "white", message: "", arrows: [], eval: null, accuracy: { correct: 0, checked: 0 } });
  thenTheEvalsAre(line, null, []);
  thenThereAreNoLegalMoves(line);
});

test("A new line starts at the start position", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450);
  thenTheLineIs(line, { fen: START, moves: [], status: "checkingPosition", message: "", arrows: [], eval: null });
  thenThereAreNoLegalMoves(line);
});

test("The examined position gets its eval, and you can move", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450);
  whenTheEngineExamines(line, 25);
  thenTheLineIs(line, { status: "yourMove", eval: 25 });
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
  thenTheLineIs(line, { moves: ["e4"], status: "waitingForReply", eval: null });
  thenThereAreNoLegalMoves(line);
});

test("The random number 0.74 picks the first of 30 and 10 games", () => {
  const line = givenANewLine(1450, 0.74);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheLineIs(line, { moves: ["e4", "e5"], status: "checkingPosition", eval: null });
});

test("The random number 0.76 picks the second of 30 and 10 games", () => {
  const line = givenANewLine(1450, 0.76);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheLineIs(line, { moves: ["e4", "c5"], status: "checkingPosition", eval: null });
});

test("A reply keeps its %, and your move has none", () => {
  const line = givenANewLine(1450, 0.74);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheMovesAre(line, [{ san: "e4", percent: null }, { san: "e5", percent: 42 }]);
});

test("Each move has the position after it", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  thenTheFenAfterMoveIs(line, 0, "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1");
  thenTheFenAfterMoveIs(line, 1, "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2");
});

test("Each position keeps its eval", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450);
  whenTheEngineExamines(line, 25);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5]);
  whenTheEngineExamines(line, 30);
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, verdict("g1f3", 35, 35));
  thenTheEvalsAre(line, 25, [null, 30, 35]);
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
  thenTheLineIs(line, { moves: ["e4", "e5", "Nf3"], status: "waitingForReply", message: "Best move.", arrows: [], eval: 30 });
});

test("A move that loses 20 centipawns or less stays", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "b1c3");
  whenTheEngineGives(line, verdict("g1f3", 30, 10));
  thenTheLineIs(line, { moves: ["e4", "e5", "Nc3"], message: "Good. The best move was Nf3.", arrows: [], eval: 10 });
});

const candidates = (...pairs: [string, number][]) => pairs.map(([move, score]) => ({ move, score, line: [move] }));

const playAMistakeAfterE5 = () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, { candidates: candidates(["g1f3", 30], ["b1c3", 20], ["f1c4", 5]), yourScore: -250, yourLine: ["f1a6"] });
  return line;
};

test("A mistake takes back your move and asks for an acceptable move", () => {
  const line = playAMistakeAfterE5();
  thenTheLineIs(line, {
    moves: ["e4", "e5"], status: "tryAgain", eval: 30, accuracy: { correct: 0, checked: 1 },
    message: "Ba6 loses 2.8 pawns. Play Nf3 or Nc3.", arrows: [{ from: "g1", to: "f3" }, { from: "b1", to: "c3" }],
  });
  thenTheLegalMovesAre(line, { g1: ["f3"], b1: ["c3"] });
  thenTheMovesAre(line, [{ san: "e4", percent: null }, { san: "e5", percent: 1 }]);
  thenTheEvalsAre(line, 0, [null, 30]);
});

test.each([
  [candidates(["g1f3", 30], ["b1c3", 0]), "Ba6 loses 2.8 pawns. Play Nf3."],
  [candidates(["g1f3", 30], ["b1c3", 20], ["f1c4", 10]), "Ba6 loses 2.8 pawns. Play Nf3, Nc3 or Bc4."],
])("The message names each acceptable move: %j", (list, message) => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, { candidates: list, yourScore: -250, yourLine: ["f1a6"] });
  thenTheLineIs(line, { status: "tryAgain", message });
});

test("A move that allows mate asks for an acceptable move", () => {
  const line = givenALineAfter(["f2f3", "e7e5"]);
  whenYouPlay(line, "g2g4");
  whenTheEngineGives(line, { candidates: candidates(["e2e4", -50]), yourScore: -10000, yourLine: ["g2g4"] });
  thenTheLineIs(line, { moves: ["f3", "e5"], status: "tryAgain", message: "g4 allows mate. Play e4." });
});

test("A move that misses a mate asks for the mate, and the mate ends the line", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6"]);
  whenYouPlay(line, "d2d3");
  whenTheEngineGives(line, { candidates: candidates(["h5f7", 10000]), yourScore: 300, yourLine: ["d2d3"] });
  thenTheLineIs(line, { status: "tryAgain", message: "d3 misses a mate. Play Qxf7#." });
  whenYouPlay(line, "h5f7");
  thenTheLineIs(line, { status: "ended", message: "Checkmate." });
});

test("A good move that is the 2nd candidate stays", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "b1c3");
  whenTheEngineGives(line, { candidates: candidates(["g1f3", 30], ["b1c3", 20]), yourScore: 20, yourLine: ["b1c3"] });
  thenTheLineIs(line, { moves: ["e4", "e5", "Nc3"], status: "waitingForReply", message: "Good. The best move was Nf3.", arrows: [] });
});

test("The message stays after the reply", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "b1c3");
  whenTheEngineGives(line, verdict("g1f3", 30, 10));
  whenTheReplyIsPickedFrom(line, [{ uci: "b8c6", san: "Nc6", games: 1, percent: 1 }]);
  thenTheLineIs(line, { status: "checkingPosition", message: "Good. The best move was Nf3." });
});

test("Your second move gets the eval of its candidate and no check", () => {
  const line = playAMistakeAfterE5();
  whenYouPlay(line, "b1c3");
  thenTheLineIs(line, {
    moves: ["e4", "e5", "Nc3"], status: "waitingForReply", message: "", arrows: [], eval: 20, accuracy: { correct: 0, checked: 1 },
  });
  thenTheMovesAre(line, [{ san: "e4", percent: null }, { san: "e5", percent: 1 }, { san: "Nc3", percent: null }]);
  thenTheEvalsAre(line, 0, [null, 30, 20]);
});

test("A mistake on your last move, then an acceptable move, ends the line", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450, "white", 2);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5]);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, { candidates: candidates(["g1f3", 30]), yourScore: -250, yourLine: ["f1a6"] });
  thenTheLineIs(line, { status: "tryAgain" });
  whenYouPlay(line, "g1f3");
  thenTheLineIs(line, { status: "ended", message: "" });
});

test("A promotion can be an acceptable move", () => {
  const line = givenALineAfter(["e2e4", "d7d5", "e4d5", "c7c6", "d5c6", "g8f6", "c6b7", "b8c6"]);
  whenYouPlay(line, "a2a3");
  whenTheEngineGives(line, { candidates: candidates(["b7a8q", 900]), yourScore: 0, yourLine: ["a2a3"] });
  thenTheLineIs(line, { status: "tryAgain", message: "a3 loses 9.0 pawns. Play bxa8=Q.", arrows: [{ from: "b7", to: "a8" }] });
  thenTheLegalMovesAre(line, { b7: ["a8"] });
  whenYouPlay(line, "b7a8q");
  thenTheLineIs(line, { status: "ended", eval: 900 });
});

test("Your second move plays the piece of its acceptable promotion", () => {
  const line = givenALineAfter(["e2e4", "d7d5", "e4d5", "c7c6", "d5c6", "g8f6", "c6b7", "b8c6"]);
  whenYouPlay(line, "a2a3");
  whenTheEngineGives(line, { candidates: candidates(["b7a8n", 900]), yourScore: 0, yourLine: ["a2a3"] });
  whenYouPlay(line, "b7a8q");
  thenTheLineIs(line, { moves: ["e4", "d5", "exd5", "c6", "dxc6", "Nf6", "cxb7", "Nc6", "bxa8=N"], status: "ended", eval: 900 });
});

test("A new line clears the acceptable moves", () => {
  const line = playAMistakeAfterE5();
  whenYouStartALine(line, 1450);
  whenTheEngineExamines(line, 0);
  thenTheLineIs(line, { arrows: [], status: "yourMove" });
  thenTheLegalMovesFrom(line, "e2", ["e3", "e4"]);
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

const playTheAccuracySequence = () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, verdict("g1f3", 30, 30));
  whenTheReplyIsPickedFrom(line, [{ uci: "b8c6", san: "Nc6", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, 30);
  whenYouPlay(line, "b1c3");
  whenTheEngineGives(line, verdict("f1b5", 30, 10));
  whenTheReplyIsPickedFrom(line, [{ uci: "g8f6", san: "Nf6", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, 30);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, verdict("f1c4", 30, -250));
  return line;
};

test("Your first move is not in the accuracy", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  thenTheLineIs(line, { accuracy: { correct: 0, checked: 0 } });
});

test("The accuracy counts the best move and a loss of 20, but not a bad move", () => {
  const line = playTheAccuracySequence();
  thenTheLineIs(line, { accuracy: { correct: 2, checked: 3 } });
});

test("A new line resets the accuracy", () => {
  const line = playTheAccuracySequence();
  whenYouStartALine(line, 1450);
  thenTheLineIs(line, { accuracy: { correct: 0, checked: 0 } });
});

test("Black starts and waits for the first White move", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450, "black");
  thenTheLineIs(line, { fen: START, moves: [], status: "waitingForReply", color: "black", eval: null });
  thenThereAreNoLegalMoves(line);
});

const playTheBlackSequence = () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450, "black");
  whenTheReplyIsPickedFrom(line, [{ uci: "e2e4", san: "e4", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, 40);
  return line;
};

test("For Black, the eval is from the White side", () => {
  const line = playTheBlackSequence();
  thenTheLineIs(line, { eval: -40, status: "yourMove" });
  thenTheEvalsAre(line, null, [-40]);
  thenTheLegalMovesFrom(line, "e7", ["e6", "e5"]);
  whenYouPlay(line, "e7e5");
  thenTheLineIs(line, { status: "waitingForReply" });
  thenTheEvalsAre(line, null, [-40, null]);
  whenTheReplyIsPickedFrom(line, [{ uci: "g1f3", san: "Nf3", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, -30);
  thenTheLineIs(line, { eval: 30 });
  whenYouPlay(line, "b8c6");
  whenTheEngineGives(line, verdict("b8c6", 25, 25));
  thenTheLineIs(line, { eval: -25, message: "Best move.", accuracy: { correct: 1, checked: 1 } });
});

test("For Black, the eval of the second move is from the White side", () => {
  const line = playTheBlackSequence();
  whenYouPlay(line, "e7e5");
  whenTheReplyIsPickedFrom(line, [{ uci: "g1f3", san: "Nf3", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, -30);
  whenYouPlay(line, "f8a3");
  whenTheEngineGives(line, { candidates: candidates(["b8c6", 25], ["g8f6", 15]), yourScore: -300, yourLine: ["f8a3"] });
  thenTheLineIs(line, { eval: -25, status: "tryAgain" });
  whenYouPlay(line, "g8f6");
  thenTheLineIs(line, { eval: -15 });
});

test("For Black, no games for the start position ends the line", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450, "black");
  whenTheReplyIsPickedFrom(line, []);
  thenTheLineIs(line, { status: "ended", message: "No games at your level after this position." });
});

test("A new White line after a Black line starts clean", () => {
  const line = playTheBlackSequence();
  whenYouStartALine(line, 1450, "white");
  thenTheLineIs(line, { color: "white", moves: [], status: "checkingPosition", message: "", arrows: [], eval: null, accuracy: { correct: 0, checked: 0 } });
  thenTheEvalsAre(line, null, []);
});

test.each([1, 2.5, Number.NaN])("The number of moves %s is rejected", (moves) => {
  const line = givenANewLine(1450);
  whenYouStartALine(line, 1450, "white", moves);
  thenYouGetTheError(line, "The number of moves must be a whole number, 2 or more.");
  thenTheLineIs(line, { status: "yourMove" });
});

test("The rating is checked before the number of moves", () => {
  const line = givenANewLine(1450);
  whenYouStartALine(line, -1, "white", 1);
  thenYouGetTheError(line, "The rating must be a whole number, 0 or more.");
});

test("With 2 moves, the line ends after your second move", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450, "white", 2);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5]);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, verdict("g1f3", 0, 0));
  thenTheLineIs(line, { status: "ended", message: "Best move." });
});

test("As Black with 3 moves, the line ends after your third move", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450, "black", 3);
  whenTheReplyIsPickedFrom(line, [{ uci: "e2e4", san: "e4", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "e7e5");
  whenTheReplyIsPickedFrom(line, [{ uci: "g1f3", san: "Nf3", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "b8c6");
  whenTheEngineGives(line, verdict("b8c6", 0, 0));
  whenTheReplyIsPickedFrom(line, [{ uci: "f1b5", san: "Bb5", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, 0);
  whenYouPlay(line, "a7a6");
  whenTheEngineGives(line, verdict("a7a6", 0, 0));
  thenTheLineIs(line, { status: "ended" });
});

test("A verdict with an illegal best move throws and keeps the state", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "f1a6");
  whenTheEngineGivesAVerdictThatThrows(line, verdict("e7e5", 30, -250));
  thenTheLineThrew(line);
  thenTheLineIs(line, { moves: ["e4", "e5", "Ba6"], status: "checkingYourMove", eval: null, accuracy: { correct: 0, checked: 0 } });
});

test("Each move of the line is a main node with its fen, % and eval", () => {
  const line = givenNoLine(0.74);
  whenYouStartALine(line, 1450);
  whenTheEngineExamines(line, 25);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5]);
  whenTheEngineExamines(line, 30);
  thenTheNodeIs(line, idOf(line), { parent: null, uci: "", san: "", fen: START, percent: null, eval: 25, main: true });
  thenTheNodeIs(line, idOf(line, "e4"), { parent: idOf(line), uci: "e2e4", san: "e4", percent: null, eval: null, main: true });
  thenTheNodeIs(line, idOf(line, "e4", "e5"), {
    parent: idOf(line, "e4"), uci: "e7e5", san: "e5", fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", percent: 42, eval: 30, main: true,
  });
  thenTheCurrentNodeIsTheLastMainNode(line);
});

const lineAfterE5 = () => givenALineAfter(["e2e4", "e7e5"]);

test("A variation move goes after the other children", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  whenYouExplore(line, idOf(line, "e4"), "e7e6");
  thenTheChildrenAre(line, idOf(line, "e4"), [{ san: "e5", main: true }, { san: "c5", main: false }, { san: "e6", main: false }]);
  thenTheNodeIs(line, idOf(line, "e4", "c5"), { uci: "c7c5", percent: null, eval: null, fen: "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2" });
  thenTheParentsComeFirst(line);
});

test("A variation can have its own variations, and the first child is its next move", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  whenYouExplore(line, idOf(line, "e4", "c5"), "g1f3");
  whenYouExplore(line, idOf(line, "e4", "c5"), "b1c3");
  thenTheChildrenAre(line, idOf(line, "e4", "c5"), [{ san: "Nf3", main: false }, { san: "Nc3", main: false }]);
  thenTheParentsComeFirst(line);
});

test("The same variation move two times adds one node", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  thenTheChildrenAre(line, idOf(line, "e4"), [{ san: "e5", main: true }, { san: "c5", main: false }]);
});

test("A variation move of the main move adds no node", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "e7e5");
  thenTheChildrenAre(line, idOf(line, "e4"), [{ san: "e5", main: true }]);
});

test("A variation that gives mate gets 10000 for White and -10000 for Black", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6"]);
  whenYouExplore(line, currentOf(line), "h5f7");
  thenTheNodeIs(line, idOf(line, "e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"), { eval: 10000 });
  const black = givenALineAfter(["f2f3", "e7e5"]);
  whenYouExplore(black, idOf(black, "f3", "e5"), "g2g4");
  whenYouExplore(black, idOf(black, "f3", "e5", "g4"), "d8h4");
  thenTheNodeIs(black, idOf(black, "f3", "e5", "g4", "Qh4#"), { eval: -10000 });
});

test("A variation that gives stalemate gets 0", () => {
  const line = givenNoLine();
  whenYouExplore(line, idOf(line), "e2e3");
  for (const move of ["a7a5", "d1h5", "a8a6", "h5a5", "h7h5", "h2h4", "a6h6", "a5c7", "f7f6", "c7d7", "e8f7", "d7b7", "d8d3", "b7b8", "d3h7", "b8c8", "f7g6", "c8e6"]) {
    whenYouExplore(line, lastVariationNode(line), move);
  }
  thenTheNodeIs(line, lastVariationNode(line), { san: "Qe6", eval: 0 });
});

function lastVariationNode(line: ReturnType<typeof givenNoLine>): number {
  return Math.max(...idsOf(line));
}

test.each([["w", 30, 30], ["b", 30, -30]])("A variation eval with %s to move is from the White side", (side, score, value) => {
  const line = lineAfterE5();
  const at = side === "b" ? idOf(line, "e4", "e5") : idOf(line, "e4");
  whenYouExplore(line, at, side === "b" ? "g1f3" : "c7c5");
  const child = side === "b" ? idOf(line, "e4", "e5", "Nf3") : idOf(line, "e4", "c5");
  whenTheEngineExaminesTheVariation(line, child, score);
  thenTheNodeIs(line, child, { eval: value });
});

test("A variation eval for a deleted node changes nothing", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  const child = idOf(line, "e4", "c5");
  whenYouDelete(line, child);
  whenTheEngineExaminesTheVariation(line, child, 30);
  thenThereIsNoNode(line, child);
  thenTheNodeCountIs(line, 3);
});

test("A delete removes the node and the nodes under it", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  whenYouExplore(line, idOf(line, "e4", "c5"), "g1f3");
  whenYouExplore(line, idOf(line, "e4"), "e7e6");
  const c5 = idOf(line, "e4", "c5");
  const nf3 = idOf(line, "e4", "c5", "Nf3");
  whenYouDelete(line, c5);
  thenThereIsNoNode(line, c5);
  thenThereIsNoNode(line, nf3);
  thenTheChildrenAre(line, idOf(line, "e4"), [{ san: "e5", main: true }, { san: "e6", main: false }]);
});

test("A delete of a main node changes nothing", () => {
  const line = lineAfterE5();
  whenYouDelete(line, idOf(line, "e4"));
  thenTheLineIs(line, { moves: ["e4", "e5"] });
});

test("You can explore from the start position before the first line", () => {
  const line = givenNoLine();
  thenTheExploreMovesFrom(line, idOf(line), "e2", ["e3", "e4"]);
  thenThereAreNoLegalMoves(line);
});

test("You can explore at the current position when the line ended", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  whenTheLineStops(line, "Stopped.");
  thenTheExploreMovesFrom(line, currentOf(line), "e7", ["e6", "e5"]);
});

test.each(["yourMove", "tryAgain"] as const)("In %s, you cannot explore at the current position, but at an old position", (status) => {
  const line = status === "yourMove" ? lineAfterE5() : playAMistakeAfterE5();
  thenTheLineIs(line, { status });
  thenThereAreNoExploreMoves(line, currentOf(line));
  thenTheExploreMovesFrom(line, idOf(line, "e4"), "c7", ["c6", "c5"]);
});

test("In checkingPosition, checkingYourMove and waitingForReply, you cannot explore", () => {
  const line = givenNoLine();
  whenYouStartALine(line, 1450);
  thenTheLineIs(line, { status: "checkingPosition" });
  thenThereAreNoExploreMoves(line, currentOf(line));
  const moved = lineAfterE5();
  whenYouPlay(moved, "g1f3");
  thenTheLineIs(moved, { status: "checkingYourMove" });
  thenThereAreNoExploreMoves(moved, idOf(moved, "e4"));
  whenTheEngineGives(moved, verdict("g1f3", 0, 0));
  thenTheLineIs(moved, { status: "waitingForReply" });
  thenThereAreNoExploreMoves(moved, idOf(moved, "e4"));
});

test("You cannot explore at a position that is not in the tree", () => {
  const line = givenNoLine();
  thenThereAreNoExploreMoves(line, 999);
});

test("A promotion gives its target square one time", () => {
  const line = givenALineAfter(["e2e4", "d7d5", "e4d5", "c7c6", "d5c6", "g8f6", "c6b7", "b8c6"]);
  whenTheLineStops(line, "Stopped.");
  thenTheExploreMovesFrom(line, currentOf(line), "b7", ["a8", "c8", "b8"]);
});

const yourLine = ["f1a6", "b8a6", "g1f3", "d7d5", "e4d5", "e5e4", "f3e5", "g8f6", "e1g1"];

test("A bad move becomes a variation with 6 moves of its line, and they get the eval of your move", () => {
  const line = lineAfterE5();
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, { candidates: candidates(["g1f3", 30], ["b1c3", 20], ["f1c4", 5]), yourScore: -624, yourLine });
  thenTheChildrenAre(line, idOf(line, "e4", "e5"), [{ san: "Ba6", main: false }]);
  thenTheVariationLineIs(line, idOf(line, "e4", "e5"), ["Ba6", "Nxa6", "Nf3", "d5", "exd5", "e4", "Ne5"]);
  for (const sans of [["Ba6"], ["Ba6", "Nxa6"], ["Ba6", "Nxa6", "Nf3", "d5", "exd5", "e4", "Ne5"]]) {
    thenTheNodeIs(line, idOf(line, "e4", "e5", ...sans), { eval: -624, main: false, percent: null });
  }
  thenTheLineIs(line, { moves: ["e4", "e5"], status: "tryAgain", eval: 30 });
  thenTheCurrentNodeIsTheLastMainNode(line);
});

test("For Black, the moves of a bad move get its eval from the White side", () => {
  const line = playTheBlackSequence();
  whenYouPlay(line, "e7e5");
  whenTheReplyIsPickedFrom(line, [{ uci: "g1f3", san: "Nf3", games: 1, percent: 1 }]);
  whenTheEngineExamines(line, -30);
  whenYouPlay(line, "f8a3");
  whenTheEngineGives(line, { candidates: candidates(["b8c6", 25]), yourScore: -300, yourLine: ["f8a3", "b2a3"] });
  thenTheNodeIs(line, idOf(line, "e4", "e5", "Nf3", "Ba3", "bxa3"), { eval: 300 });
});

test("A shorter line of a bad move gives fewer nodes", () => {
  const line = lineAfterE5();
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, { candidates: candidates(["g1f3", 30]), yourScore: -624, yourLine: ["f1a6", "b8a6"] });
  thenTheVariationLineIs(line, idOf(line, "e4", "e5"), ["Ba6", "Nxa6"]);
});

test("After a mistake, the acceptable move is the first child", () => {
  const line = playAMistakeAfterE5();
  whenYouPlay(line, "g1f3");
  thenTheChildrenAre(line, idOf(line, "e4", "e5"), [{ san: "Nf3", main: true }, { san: "Ba6", main: false }]);
  thenTheCurrentNodeIsTheLastMainNode(line);
});

test("A good move does not use its line", () => {
  const line = lineAfterE5();
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, { candidates: candidates(["g1f3", 30]), yourScore: 30, yourLine: ["g1f3", "b8c6"] });
  thenTheChildrenAre(line, idOf(line, "e4", "e5", "Nf3"), []);
});

test("A variation stays when the line goes on", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, verdict("g1f3", 30, 30));
  thenTheChildrenAre(line, idOf(line, "e4"), [{ san: "e5", main: true }, { san: "c5", main: false }]);
});

test("A new line gives new ids", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  const oldIds = idsOf(line);
  whenYouStartALine(line, 1450);
  thenTheNodeCountIs(line, 1);
  thenTheIdsAreNew(line, oldIds);
});


test("A new node has no engine lines", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  thenTheNodeIs(line, idOf(line), { lines: null });
  thenTheNodeIs(line, idOf(line, "e4", "e5"), { lines: null });
  thenTheNodeIs(line, idOf(line, "e4", "c5"), { lines: null });
});

test("The engine lines are kept in SAN, with the eval from the White side", () => {
  const line = lineAfterE5();
  whenTheEngineGivesTheLines(line, idOf(line, "e4", "e5"), [
    { move: "g1f3", score: 30, line: ["g1f3", "b8c6", "f1b5"] },
    { move: "f1c4", score: 20, line: ["f1c4"] },
  ]);
  whenTheEngineGivesTheLines(line, idOf(line, "e4"), [{ move: "c7c5", score: 30, line: ["c7c5", "g1f3"] }]);
  thenTheNodeIs(line, idOf(line, "e4", "e5"), { lines: [{ eval: 30, sans: ["Nf3", "Nc6", "Bb5"] }, { eval: 20, sans: ["Bc4"] }] });
  thenTheNodeIs(line, idOf(line, "e4"), { lines: [{ eval: -30, sans: ["c5", "Nf3"] }] });
});

test("Engine lines for a deleted node change nothing", () => {
  const line = lineAfterE5();
  whenYouExplore(line, idOf(line, "e4"), "c7c5");
  const at = idOf(line, "e4", "c5");
  whenYouDelete(line, at);
  whenTheEngineGivesTheLines(line, at, [{ move: "g1f3", score: 0, line: ["g1f3"] }]);
  thenThereIsNoNode(line, at);
});

test("A variation that gives mate has empty engine lines", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6"]);
  whenYouExplore(line, currentOf(line), "h5f7");
  thenTheNodeIs(line, idOf(line, "e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"), { lines: [] });
});
