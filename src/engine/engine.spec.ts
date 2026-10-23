import { test } from "vitest";
import {
  givenAnEngineThatAnswers,
  givenAnEngineWhoseWorkerFails,
  thenTheCommandsEndWith,
  thenTheCommandsWere,
  thenTheErrorIs,
  thenTheVerdictIs,
  whenYouAskForAJudgement,
} from "./engine.steps.ts";

const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const SEARCH = [
  "info string NNUE evaluation using nn-1c0000000000.nnue",
  "info depth 15 seldepth 18 score cp 20 pv e2e4",
  "info depth 16 seldepth 21 multipv 1 score cp 34 nodes 9000 pv e2e4 e7e5",
  "bestmove e2e4 ponder e7e5",
];

test("The best move needs one search", async () => {
  const engine = givenAnEngineThatAnswers({ search: SEARCH });
  await whenYouAskForAJudgement(engine, FEN, "e2e4");
  thenTheVerdictIs(engine, { bestMove: "e2e4", bestScore: 34, yourScore: 34 });
  thenTheCommandsWere(engine, ["uci", "ucinewgame", "isready", `position fen ${FEN}`, "go depth 16"]);
});

test("A different move gets a second search with searchmoves", async () => {
  const engine = givenAnEngineThatAnswers({
    search: SEARCH,
    searchmoves: ["info depth 16 score cp -40 upperbound pv a2a3", "bestmove a2a3"],
  });
  await whenYouAskForAJudgement(engine, FEN, "a2a3");
  thenTheVerdictIs(engine, { bestMove: "e2e4", bestScore: 34, yourScore: -40 });
  thenTheCommandsEndWith(engine, [`position fen ${FEN}`, "go depth 16 searchmoves a2a3"]);
});

test.each([["score mate 3", 10000], ["score mate -2", -10000]])("%s becomes %i", async (score, value) => {
  const engine = givenAnEngineThatAnswers({ search: [`info depth 16 ${score} pv e2e4`, "bestmove e2e4"] });
  await whenYouAskForAJudgement(engine, FEN, "e2e4");
  thenTheVerdictIs(engine, { bestMove: "e2e4", bestScore: value, yourScore: value });
});

test("A worker error gives the engine message", async () => {
  const engine = givenAnEngineWhoseWorkerFails();
  await whenYouAskForAJudgement(engine, FEN, "e2e4");
  thenTheErrorIs(engine, "The engine did not start. Reload the page.");
});
