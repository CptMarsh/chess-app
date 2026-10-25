import { test } from "vitest";
import {
  givenAnEngineThatAnswers,
  givenAnEngineWhoseWorkerFails,
  thenTheCommandsWere,
  thenTheCandidatesAre,
  thenTheErrorIs,
  givenAnEngineThatFailsOnTheFen,
  whenYouAskForAnAnalysisAndAScoreAtOnce,
  thenTheScoreIs,
  whenYouAskForAnAnalysis,
  whenYouAskForTheScoreOf,
} from "./engine.steps.ts";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const SEARCH = [
  "info string NNUE evaluation using nn-1c0000000000.nnue",
  "info depth 15 seldepth 18 multipv 1 score cp 20 nodes 4000 pv e2e4",
  "info depth 16 seldepth 21 multipv 1 score cp 34 nodes 9000 pv e2e4 e7e5",
  "info depth 16 seldepth 20 multipv 2 score cp 30 nodes 9000 pv d2d4 d7d5",
  "info depth 16 seldepth 19 multipv 3 score cp 25 nodes 9000 pv g1f3 g8f6",
  "bestmove e2e4 ponder e7e5",
];

test("An analysis gives the last line of each multipv, in order", async () => {
  const engine = givenAnEngineThatAnswers({ search: SEARCH });
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheCandidatesAre(engine, [
    { move: "e2e4", score: 34, line: ["e2e4", "e7e5"] }, { move: "d2d4", score: 30, line: ["d2d4", "d7d5"] }, { move: "g1f3", score: 25, line: ["g1f3", "g8f6"] },
  ]);
  thenTheCommandsWere(engine, ["uci", "setoption name MultiPV value 3", "ucinewgame", "isready", `position fen ${FEN}`, "go depth 16"]);
});

test("With 2 legal moves, an analysis gives 2 candidates", async () => {
  const engine = givenAnEngineThatAnswers({ search: [
    "info depth 16 multipv 1 score cp -50 pv e8d7", "info depth 16 multipv 2 score cp -90 pv e8f7", "bestmove e8d7",
  ] });
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheCandidatesAre(engine, [{ move: "e8d7", score: -50, line: ["e8d7"] }, { move: "e8f7", score: -90, line: ["e8f7"] }]);
});

test("A score searches only your move", async () => {
  const engine = givenAnEngineThatAnswers({
    search: SEARCH,
    searchmoves: ["info depth 15 score cp -20 pv a2a3 e7e5", "info depth 16 score cp -40 upperbound pv a2a3 d7d5 b2b4", "bestmove a2a3"],
  });
  await whenYouAskForTheScoreOf(engine, FEN, "a2a3");
  thenTheScoreIs(engine, { move: "a2a3", score: -40, line: ["a2a3", "d7d5", "b2b4"] });
  thenTheCommandsWere(engine, ["uci", `position fen ${FEN}`, "go depth 16 searchmoves a2a3"]);
});

test.each([["score mate 3", 10000], ["score mate -2", -10000]])("An analysis with %s becomes %i", async (score, value) => {
  const engine = givenAnEngineThatAnswers({ search: [`info depth 16 multipv 1 ${score} pv e2e4`, "bestmove e2e4"] });
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheCandidatesAre(engine, [{ move: "e2e4", score: value, line: ["e2e4"] }]);
});

test.each([["score mate 3", 10000], ["score mate -2", -10000]])("A score with %s becomes %i", async (score, value) => {
  const engine = givenAnEngineThatAnswers({
    search: SEARCH,
    searchmoves: [`info depth 16 ${score} pv a2a3`, "bestmove a2a3"],
  });
  await whenYouAskForTheScoreOf(engine, FEN, "a2a3");
  thenTheScoreIs(engine, { move: "a2a3", score: value, line: ["a2a3"] });
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

test("A score without pv gives a line of your move", async () => {
  const engine = givenAnEngineThatAnswers({ search: SEARCH, searchmoves: ["info depth 16 score cp -40", "bestmove a2a3"] });
  await whenYouAskForTheScoreOf(engine, FEN, "a2a3");
  thenTheScoreIs(engine, { move: "a2a3", score: -40, line: ["a2a3"] });
});

test("A second call starts only after the first call is complete", async () => {
  const engine = givenAnEngineThatAnswers({ search: SEARCH, searchmoves: ["info depth 16 score cp -40 pv a2a3", "bestmove a2a3"] });
  await whenYouAskForAnAnalysisAndAScoreAtOnce(engine, FEN, "a2a3");
  thenTheCommandsWere(engine, [
    "uci", "setoption name MultiPV value 3", "ucinewgame", "isready", `position fen ${FEN}`, "go depth 16", `position fen ${FEN}`, "go depth 16 searchmoves a2a3",
  ]);
  thenTheScoreIs(engine, { move: "a2a3", score: -40, line: ["a2a3"] });
  thenTheCandidatesAre(engine, [
    { move: "e2e4", score: 34, line: ["e2e4", "e7e5"] }, { move: "d2d4", score: 30, line: ["d2d4", "d7d5"] }, { move: "g1f3", score: 25, line: ["g1f3", "g8f6"] },
  ]);
});

test("A call after a failed call works", async () => {
  const engine = givenAnEngineThatFailsOnTheFen("bad", { search: SEARCH });
  await whenYouAskForAnAnalysis(engine, "bad");
  thenTheErrorIs(engine, "The fen is bad.");
  await whenYouAskForAnAnalysis(engine, FEN);
  thenTheCandidatesAre(engine, [
    { move: "e2e4", score: 34, line: ["e2e4", "e7e5"] }, { move: "d2d4", score: 30, line: ["d2d4", "d7d5"] }, { move: "g1f3", score: 25, line: ["g1f3", "g8f6"] },
  ]);
});
