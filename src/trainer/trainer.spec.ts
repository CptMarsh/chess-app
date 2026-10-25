import { test } from "vitest";
import {
  fenAfter,
  givenATrainer,
  givenATrainerThatHoldsItsAnswers,
  givenATrainerThatReplies,
  givenATrainerThatScores,
  givenATrainerWithAFailingEngine,
  givenATrainerWithAFailingExplorer,
  givenATrainerWithAFailingScore,
  givenATrainerWithAFailingView,
  givenATrainerWithCandidates,
  givenATrainerWhoseAnalysisFailsAfter,
  thenTheNodeIs,
  thenTheVariationIs,
  whenYouExplore,
  thenTheEngineExamined,
  thenTheExplorerWasAskedWith,
  thenTheExplorerWasAskedTimes,
  thenTheLineIs,
  thenTheScoreWasAskedWith,
  thenTheScoreWasNotAsked,
  thenTheViewWasShown,
  whenTheEngineAnalyses,
  whenTheEngineScores,
  whenTheExplorerAnswers,
  whenYouPlay,
  whenYouStart,
  whenYouStartALineWithoutWaiting,
  whenYouStartToPlay,
  thenYouGetTheError,
} from "./trainer.steps.ts";

const START = fenAfter([]);

test("The engine examines the start position", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, 1450);
  thenTheEngineExamined(trainer, [START]);
  thenTheLineIs(trainer, { status: "yourMove", eval: 0 });
});

test("Your first move goes to the explorer without a check", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  thenTheScoreWasNotAsked(trainer);
  thenTheExplorerWasAskedWith(trainer, fenAfter(["e2e4"]), 1450);
  thenTheEngineExamined(trainer, [START, fenAfter(["e2e4", "e7e5"])]);
  thenTheLineIs(trainer, { moves: ["e4", "e5"], status: "yourMove" });
});

test("Your best move needs no score", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "g1f3");
  thenTheScoreWasNotAsked(trainer);
  thenTheLineIs(trainer, { message: "Best move." });
});

test("Your move that is the 2nd candidate gets the score of that candidate, with no score call", async () => {
  const trainer = givenATrainerWithCandidates([{ move: "g1f3", score: 30, line: ["g1f3"] }, { move: "b1c3", score: 0, line: ["b1c3"] }]);
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "b1c3");
  thenTheScoreWasNotAsked(trainer);
  thenTheLineIs(trainer, { status: "tryAgain", message: "Nc3 loses 0.3 pawns. Play Nf3." });
});

test("Another move gets a score in the position before it", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "b1c3");
  thenTheScoreWasAskedWith(trainer, fenAfter(["e2e4", "e7e5"]), "b1c3");
  thenTheLineIs(trainer, { message: "Good. The best move was Nf3." });
});

test("The status shows each wait", async () => {
  const trainer = givenATrainerThatHoldsItsAnswers();
  whenYouStartALineWithoutWaiting(trainer, 1450);
  thenTheLineIs(trainer, { status: "checkingPosition" });
  await whenTheEngineAnalyses(trainer, [{ move: "g1f3", score: 0, line: ["g1f3"] }]);
  thenTheLineIs(trainer, { status: "yourMove" });
  whenYouStartToPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "e7e5", san: "e5", games: 1, percent: 1 }]);
  thenTheLineIs(trainer, { status: "checkingPosition" });
  await whenTheEngineAnalyses(trainer, [{ move: "g1f3", score: 30, line: ["g1f3"] }]);
  thenTheLineIs(trainer, { status: "yourMove" });
  whenYouStartToPlay(trainer, "b1c3");
  thenTheLineIs(trainer, { status: "checkingYourMove" });
  await whenTheEngineScores(trainer, 10);
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "b8c6", san: "Nc6", games: 1, percent: 1 }]);
  thenTheLineIs(trainer, { status: "checkingPosition" });
  await whenTheEngineAnalyses(trainer, [{ move: "g1f3", score: 0, line: ["g1f3"] }]);
  thenTheLineIs(trainer, { status: "yourMove" });
  thenTheViewWasShown(trainer, 9);
});

test("The engine and the explorer are not asked after your fifth move", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, 1450);
  for (const move of ["e2e4", "b1c3", "d2d3", "a2a3", "h2h3"]) await whenYouPlay(trainer, move);
  thenTheExplorerWasAskedTimes(trainer, 4);
  thenTheEngineExamined(trainer, [
    START,
    fenAfter(["e2e4", "e7e5"]),
    fenAfter(["e2e4", "e7e5", "b1c3", "b8c6"]),
    fenAfter(["e2e4", "e7e5", "b1c3", "b8c6", "d2d3", "a7a6"]),
    fenAfter(["e2e4", "e7e5", "b1c3", "b8c6", "d2d3", "a7a6", "a2a3", "g8f6"]),
  ]);
  thenTheLineIs(trainer, { status: "ended" });
});

test("An engine error at the start stops the line", async () => {
  const trainer = givenATrainerWithAFailingEngine("The engine did not start. Reload the page.");
  await whenYouStart(trainer, 1450);
  thenTheLineIs(trainer, { status: "ended", message: "The engine did not start. Reload the page." });
});

test("An engine score error stops the line", async () => {
  const trainer = givenATrainerWithAFailingScore("The engine did not start. Reload the page.");
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "b1c3");
  thenTheLineIs(trainer, { status: "ended", message: "The engine did not start. Reload the page." });
});

test("The line ends after the number of moves that you chose", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, 1450, "white", 3);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "d2d3");
  await whenYouPlay(trainer, "c1e3");
  thenTheLineIs(trainer, { status: "ended" });
  thenTheExplorerWasAskedTimes(trainer, 2);
});

test("An explorer error stops the line", async () => {
  const trainer = givenATrainerWithAFailingExplorer("Lichess did not answer (status 503).");
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "ended", message: "Lichess did not answer (status 503)." });
});

test("A view error after StartLine stops the line", async () => {
  const trainer = givenATrainerWithAFailingView("The view failed.");
  await whenYouStart(trainer, 1450);
  thenTheLineIs(trainer, { status: "ended", message: "The view failed." });
});

test("A bad rating goes to the caller", async () => {
  const trainer = givenATrainer();
  await whenYouStart(trainer, -1);
  thenYouGetTheError(trainer, "The rating must be a whole number, 0 or more.");
  thenTheEngineExamined(trainer, []);
});

test("For Black, the explorer picks the first White move, then the engine examines the position", async () => {
  const trainer = givenATrainerThatReplies(["e2e4", "g1f3"]);
  await whenYouStart(trainer, 1450, "black");
  thenTheExplorerWasAskedWith(trainer, START, 1450);
  thenTheEngineExamined(trainer, [fenAfter(["e2e4"])]);
  thenTheLineIs(trainer, { moves: ["e4"], status: "yourMove", color: "black" });
});

test("For Black, your first move gets no check", async () => {
  const trainer = givenATrainerThatReplies(["e2e4", "g1f3"]);
  await whenYouStart(trainer, 1450, "black");
  await whenYouPlay(trainer, "e7e5");
  thenTheScoreWasNotAsked(trainer);
  thenTheLineIs(trainer, { moves: ["e4", "e5", "Nf3"], status: "yourMove" });
});

const playAMistake = async () => {
  const trainer = givenATrainerThatScores(-250);
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "f1a6");
  return trainer;
};

test("After a mistake, the trainer stops", async () => {
  const trainer = await playAMistake();
  thenTheLineIs(trainer, { moves: ["e4", "e5"], status: "tryAgain" });
  thenTheExplorerWasAskedTimes(trainer, 1);
  thenTheEngineExamined(trainer, [START, fenAfter(["e2e4", "e7e5"])]);
});

test("Your second move gets no check and gets a reply", async () => {
  const trainer = await playAMistake();
  await whenYouPlay(trainer, "g1f3");
  thenTheScoreWasAskedWith(trainer, fenAfter(["e2e4", "e7e5"]), "f1a6");
  thenTheExplorerWasAskedTimes(trainer, 2);
  thenTheLineIs(trainer, { moves: ["e4", "e5", "Nf3", "Nc6"], status: "yourMove" });
});

test("The verdict has the line of your move from the score", async () => {
  const trainer = givenATrainerThatScores(-250, ["f1a6", "b8a6", "g1f3"]);
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "f1a6");
  thenTheVariationIs(trainer, ["e4", "e5"], ["Ba6", "Nxa6", "Nf3"]);
});

test("The verdict has the line of your move from its candidate", async () => {
  const trainer = givenATrainerWithCandidates([{ move: "g1f3", score: 30, line: ["g1f3"] }, { move: "b1c3", score: 0, line: ["b1c3", "g8f6"] }]);
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "b1c3");
  thenTheScoreWasNotAsked(trainer);
  thenTheVariationIs(trainer, ["e4", "e5"], ["Nc3", "Nf6"]);
});

test("An exploration sends the move, asks the engine and sends the eval", async () => {
  const trainer = givenATrainerWithCandidates([{ move: "g1f3", score: 40, line: ["g1f3"] }]);
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouExplore(trainer, ["e4"], "c7c5");
  thenTheEngineExamined(trainer, [START, fenAfter(["e2e4", "e7e5"]), fenAfter(["e2e4", "c7c5"])]);
  thenTheNodeIs(trainer, ["e4", "c5"], { eval: 40, main: false });
  thenTheLineIs(trainer, { moves: ["e4", "e5"], status: "yourMove" });
  thenTheViewWasShown(trainer, 7);
});

test("An exploration to a position with an eval does not ask the engine", async () => {
  const trainer = givenATrainerThatReplies(["e7e5", "b8c6", "g8f6"]);
  await whenYouStart(trainer, 1450, "white", 4);
  for (const move of ["e2e4", "f1c4", "d1h5"]) await whenYouPlay(trainer, move);
  await whenYouExplore(trainer, ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6"], "h5f7");
  thenTheEngineExamined(trainer, [START, fenAfter(["e2e4", "e7e5"]), fenAfter(["e2e4", "e7e5", "f1c4", "b8c6"]), fenAfter(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6"])]);
  thenTheNodeIs(trainer, ["e4", "e5", "Bc4", "Nc6", "Qh5", "Nf6", "Qxf7#"], { eval: 10000 });
});

test("An engine error in an exploration stops the line", async () => {
  const trainer = givenATrainerWhoseAnalysisFailsAfter(2, "The engine did not start. Reload the page.");
  await whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouExplore(trainer, ["e4"], "c7c5");
  thenTheLineIs(trainer, { status: "ended", message: "The engine did not start. Reload the page." });
});
