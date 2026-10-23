import { test } from "vitest";
import {
  fenAfter,
  givenATrainer,
  givenATrainerThatHoldsItsAnswers,
  givenATrainerWithAFailingEngine,
  givenATrainerWithAFailingExplorer,
  thenTheEngineWasAskedWith,
  thenTheEngineWasNotAsked,
  thenTheExplorerWasAskedWith,
  thenTheExplorerWasAskedTimes,
  thenTheLineIs,
  thenTheViewWasShown,
  whenTheEngineAnswers,
  whenTheExplorerAnswers,
  whenYouPlay,
  whenYouStart,
  whenYouStartToPlay,
  thenYouGetTheError,
} from "./trainer.steps.ts";

test("Your first move goes to the explorer without a judgement", async () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  thenTheEngineWasNotAsked(trainer);
  thenTheExplorerWasAskedWith(trainer, fenAfter(["e2e4"]), 1450);
  thenTheLineIs(trainer, { moves: ["e4", "e5"], status: "yourMove" });
});

test("The status shows each wait", async () => {
  const trainer = givenATrainerThatHoldsItsAnswers();
  whenYouStart(trainer, 1450);
  whenYouStartToPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "e7e5", san: "e5", games: 1 }]);
  whenYouStartToPlay(trainer, "g1f3");
  thenTheLineIs(trainer, { status: "checkingYourMove" });
  await whenTheEngineAnswers(trainer, { bestMove: "g1f3", bestScore: 0, yourScore: 0 });
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "b8c6", san: "Nc6", games: 1 }]);
  thenTheLineIs(trainer, { status: "yourMove" });
  thenTheViewWasShown(trainer, 6);
});

test("The explorer is not asked after your fifth move", async () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, 1450);
  for (const move of ["e2e4", "g1f3", "f1b5", "b5a4", "e1g1"]) await whenYouPlay(trainer, move);
  thenTheExplorerWasAskedTimes(trainer, 4);
  thenTheLineIs(trainer, { status: "ended" });
});

test("An engine error stops the line", async () => {
  const trainer = givenATrainerWithAFailingEngine("The engine did not start. Reload the page.");
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "g1f3");
  thenTheLineIs(trainer, { status: "ended", message: "The engine did not start. Reload the page." });
});

test("An explorer error stops the line", async () => {
  const trainer = givenATrainerWithAFailingExplorer("Lichess did not answer (status 503).");
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "ended", message: "Lichess did not answer (status 503)." });
});

test("A bad rating goes to the caller", () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, -1);
  thenYouGetTheError(trainer, "The rating must be a whole number, 0 or more.");
});

test("The engine judges your move in the position before it", async () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "g1f3");
  thenTheEngineWasAskedWith(trainer, fenAfter(["e2e4", "e7e5"]), "g1f3");
});
