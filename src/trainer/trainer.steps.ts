import { Chess } from "chess.js";
import { expect } from "vitest";
import { attachLine } from "../line/line.ts";
import { CurrentLine, LineBus, type Candidate, type Color, type LineView, type Reply } from "../line/messages.ts";
import { Trainer } from "./trainer.ts";

type TestTrainer = {
  trainer: Trainer;
  bus: LineBus;
  analyseCalls: string[];
  scoreCalls: { fen: string; move: string }[];
  explorerCalls: { fen: string; rating: number }[];
  shown: { count: number };
  error?: unknown;
  answerAnalysis?: (candidates: Candidate[]) => void;
  answerScore?: (score: number) => void;
  answerExplorer?: (replies: Reply[]) => void;
};

const DEFAULT_REPLIES = ["e7e5", "b8c6", "a7a6", "g8f6"];
const SAN: Record<string, string> = { e7e5: "e5", b8c6: "Nc6", a7a6: "a6", g8f6: "Nf6" };

function build(
  analyse: (test: TestTrainer) => Promise<Candidate[]>,
  score: (test: TestTrainer) => Promise<number>,
  replies: (test: TestTrainer) => Promise<Reply[]>,
  failingShow?: Error,
): TestTrainer {
  const bus = new LineBus();
  attachLine(bus, () => 0);
  const test = { bus, analyseCalls: [], scoreCalls: [], explorerCalls: [], shown: { count: 0 } } as unknown as TestTrainer;
  const engine = {
    analyse: (fen: string) => {
      test.analyseCalls.push(fen);
      return analyse(test);
    },
    score: (fen: string, move: string) => {
      test.scoreCalls.push({ fen, move });
      return score(test);
    },
  };
  const explorer = {
    replies: (fen: string, rating: number) => {
      test.explorerCalls.push({ fen, rating });
      return replies(test);
    },
  };
  test.trainer = new Trainer(bus, engine, explorer, () => {
    test.shown.count += 1;
    if (failingShow && test.shown.count === 1) throw failingShow;
  });
  return test;
}

const defaultAnalysis = () => Promise.resolve([{ move: "g1f3", score: 0 }]);
const defaultScore = () => Promise.resolve(0);

function defaultReplies(test: TestTrainer): Promise<Reply[]> {
  const uci = DEFAULT_REPLIES[test.explorerCalls.length - 1];
  return Promise.resolve([{ uci, san: SAN[uci], games: 1, percent: 1 }]);
}

export function givenATrainer(): TestTrainer {
  return build(defaultAnalysis, defaultScore, defaultReplies);
}

export function givenATrainerThatReplies(moves: string[]): TestTrainer {
  return build(defaultAnalysis, defaultScore, (test) => Promise.resolve([{ uci: moves[test.explorerCalls.length - 1], san: "", games: 1, percent: 1 }]));
}

export function givenATrainerThatScores(score: number): TestTrainer {
  return build(defaultAnalysis, () => Promise.resolve(score), defaultReplies);
}

export function givenATrainerWithCandidates(candidates: Candidate[]): TestTrainer {
  return build(() => Promise.resolve(candidates), defaultScore, defaultReplies);
}

export function givenATrainerThatHoldsItsAnswers(): TestTrainer {
  return build(
    (test) => new Promise<Candidate[]>((resolve) => { test.answerAnalysis = resolve; }),
    (test) => new Promise<number>((resolve) => { test.answerScore = resolve; }),
    (test) => new Promise<Reply[]>((resolve) => { test.answerExplorer = resolve; }),
  );
}

export function givenATrainerWithAFailingEngine(message: string): TestTrainer {
  const fail = () => Promise.reject(new Error(message));
  return build(fail, fail, defaultReplies);
}

export function givenATrainerWithAFailingScore(message: string): TestTrainer {
  return build(defaultAnalysis, () => Promise.reject(new Error(message)), defaultReplies);
}

export function givenATrainerWithAFailingView(message: string): TestTrainer {
  return build(defaultAnalysis, defaultScore, defaultReplies, new Error(message));
}

export function givenATrainerWithAFailingExplorer(message: string): TestTrainer {
  return build(defaultAnalysis, defaultScore, () => Promise.reject(new Error(message)));
}

export async function whenYouStart(test: TestTrainer, rating: number, color: Color = "white", moves = 5) {
  try {
    await test.trainer.start(rating, color, moves);
  } catch (error) {
    test.error = error;
  }
}

export function whenYouStartALineWithoutWaiting(test: TestTrainer, rating: number) {
  void test.trainer.start(rating, "white", 5);
}

export async function whenYouPlay(test: TestTrainer, move: string) {
  await test.trainer.yourMove(move);
}

export function whenYouStartToPlay(test: TestTrainer, move: string) {
  void test.trainer.yourMove(move);
}

export async function whenTheEngineAnalyses(test: TestTrainer, candidates: Candidate[]) {
  test.answerAnalysis?.(candidates);
  await new Promise((resolve) => setTimeout(resolve));
}

export async function whenTheEngineScores(test: TestTrainer, score: number) {
  test.answerScore?.(score);
  await new Promise((resolve) => setTimeout(resolve));
}

export async function whenTheExplorerAnswers(test: TestTrainer, replies: Reply[]) {
  test.answerExplorer?.(replies);
  await new Promise((resolve) => setTimeout(resolve));
}

export function fenAfter(moves: string[]): string {
  const chess = new Chess();
  for (const move of moves) {
    chess.move({ from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] });
  }
  return chess.fen();
}

export function thenTheEngineExamined(test: TestTrainer, fens: string[]) {
  expect(test.analyseCalls).toEqual(fens);
}

export function thenTheScoreWasAskedWith(test: TestTrainer, fen: string, move: string) {
  expect(test.scoreCalls).toEqual([{ fen, move }]);
}

export function thenTheScoreWasNotAsked(test: TestTrainer) {
  expect(test.scoreCalls).toEqual([]);
}

export function thenTheExplorerWasAskedWith(test: TestTrainer, fen: string, rating: number) {
  expect(test.explorerCalls[0]).toEqual({ fen, rating });
}

export function thenTheExplorerWasAskedTimes(test: TestTrainer, times: number) {
  expect(test.explorerCalls).toHaveLength(times);
}

export function thenTheLineIs(test: TestTrainer, expected: Partial<Omit<LineView, "moves">> & { moves?: string[] }) {
  const line = test.bus.ask(new CurrentLine());
  expect({ ...line, moves: line.moves.map(({ san }) => san) }).toMatchObject(expected);
}

export function thenTheViewWasShown(test: TestTrainer, times: number) {
  expect(test.shown.count).toBe(times);
}

export function thenYouGetTheError(test: TestTrainer, message: string) {
  expect(test.error).toEqual(new Error(message));
}
