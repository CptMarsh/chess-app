import { test } from "vitest";
import {
  givenAnEngineThatAnswers,
  givenAnEngineWhoseWorkerFails,
  thenTheCommandsWere,
  thenTheAnalysisIs,
  thenTheErrorIs,
  thenTheScoreIs,
  whenYouAskForAnAnalysis,
  whenYouAskForTheScoreOf,
} from "./engine.steps.ts";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const SEARCH = [
  "info string NNUE evaluation using nn-1c0000000000.nnue",
  "info depth 15 seldepth 18 score cp 20 pv e2e4",
  "info depth 16 seldepth 21 multipv 1 score cp 34 nodes 9000 pv e2e4 e7e5",
  "bestmove e2e4 ponder e7e5",
];

test("An analysis needs one search", async () => {
  const engine = givenAnEngineThatAnswers({ search: SEARCH });
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheAnalysisIs(engine, { bestMove: "e2e4", score: 34 });
  thenTheCommandsWere(engine, ["uci", "ucinewgame", "isready", `position fen ${FEN}`, "go depth 16"]);
});

test("A score searches only your move", async () => {
  const engine = givenAnEngineThatAnswers({
    search: SEARCH,
    searchmoves: ["info depth 16 score cp -40 upperbound pv a2a3", "bestmove a2a3"],
  });
  await whenYouAskForTheScoreOf(engine, FEN, "a2a3");
  thenTheScoreIs(engine, -40);
  thenTheCommandsWere(engine, ["uci", `position fen ${FEN}`, "go depth 16 searchmoves a2a3"]);
});

test.each([["score mate 3", 10000], ["score mate -2", -10000]])("An analysis with %s becomes %i", async (score, value) => {
  const engine = givenAnEngineThatAnswers({ search: [`info depth 16 ${score} pv e2e4`, "bestmove e2e4"] });
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheAnalysisIs(engine, { bestMove: "e2e4", score: value });
});

test.each([["score mate 3", 10000], ["score mate -2", -10000]])("A score with %s becomes %i", async (score, value) => {
  const engine = givenAnEngineThatAnswers({
    search: SEARCH,
    searchmoves: [`info depth 16 ${score} pv a2a3`, "bestmove a2a3"],
  });
  await whenYouAskForTheScoreOf(engine, FEN, "a2a3");
  thenTheScoreIs(engine, value);
});

test("A worker error stops an analysis", async () => {
  const engine = givenAnEngineWhoseWorkerFails();
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheErrorIs(engine, "The engine did not start. Reload the page.");
});

test("A worker error stops a score", async () => {
  const engine = givenAnEngineWhoseWorkerFails();
  await whenYouAskForTheScoreOf(engine, FEN, "a2a3");
  thenTheErrorIs(engine, "The engine did not start. Reload the page.");
});
