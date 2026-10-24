import { test } from "vitest";
import {
  fenAfter,
  givenATrainer,
  givenATrainerThatHoldsItsAnswers,
  givenATrainerThatReplies,
  givenATrainerWithAFailingEngine,
  givenATrainerWithAFailingExplorer,
  givenATrainerWithAFailingScore,
  givenATrainerWithAFailingView,
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
  await whenTheEngineAnalyses(trainer, { bestMove: "g1f3", score: 0 });
  thenTheLineIs(trainer, { status: "yourMove" });
  whenYouStartToPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "e7e5", san: "e5", games: 1, percent: 1 }]);
  thenTheLineIs(trainer, { status: "checkingPosition" });
  await whenTheEngineAnalyses(trainer, { bestMove: "g1f3", score: 30 });
  thenTheLineIs(trainer, { status: "yourMove" });
  whenYouStartToPlay(trainer, "b1c3");
  thenTheLineIs(trainer, { status: "checkingYourMove" });
  await whenTheEngineScores(trainer, 10);
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "b8c6", san: "Nc6", games: 1, percent: 1 }]);
  thenTheLineIs(trainer, { status: "checkingPosition" });
  await whenTheEngineAnalyses(trainer, { bestMove: "g1f3", score: 0 });
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
