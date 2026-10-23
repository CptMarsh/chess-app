import { Chess } from "chess.js";
import { expect } from "vitest";
import { attachLine } from "../line/line.ts";
import { CurrentLine, LineBus, type LineView, type Reply, type Verdict } from "../line/messages.ts";
import { Trainer } from "./trainer.ts";

type TestTrainer = {
  trainer: Trainer;
  bus: LineBus;
  engineCalls: { fen: string; move: string }[];
  explorerCalls: { fen: string; rating: number }[];
  shown: { count: number };
  error?: unknown;
  answerEngine?: (verdict: Verdict) => void;
  answerExplorer?: (replies: Reply[]) => void;
};

const DEFAULT_REPLIES = ["e7e5", "b8c6", "a7a6", "g8f6"];
const SAN: Record<string, string> = { e7e5: "e5", b8c6: "Nc6", a7a6: "a6", g8f6: "Nf6" };

function build(
  judge: (test: TestTrainer, move: string) => Promise<Verdict>,
  replies: (test: TestTrainer) => Promise<Reply[]>,
): TestTrainer {
  const bus = new LineBus();
  attachLine(bus, () => 0);
  const test = { bus, engineCalls: [], explorerCalls: [], shown: { count: 0 } } as unknown as TestTrainer;
  const engine = {
    judge: (fen: string, move: string) => {
      test.engineCalls.push({ fen, move });
      return judge(test, move);
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
  });
  return test;
}

function defaultVerdict(move: string): Promise<Verdict> {
  return Promise.resolve({ bestMove: move, bestScore: 0, yourScore: 0 });
}

function defaultReplies(test: TestTrainer): Promise<Reply[]> {
  const uci = DEFAULT_REPLIES[test.explorerCalls.length - 1];
  return Promise.resolve([{ uci, san: SAN[uci], games: 1 }]);
}

export function givenATrainer(): TestTrainer {
  return build((_test, move) => defaultVerdict(move), defaultReplies);
}

export function givenATrainerThatHoldsItsAnswers(): TestTrainer {
  return build(
    (test) => new Promise<Verdict>((resolve) => { test.answerEngine = resolve; }),
    (test) => new Promise<Reply[]>((resolve) => { test.answerExplorer = resolve; }),
  );
}

export function givenATrainerWithAFailingEngine(message: string): TestTrainer {
  return build(() => Promise.reject(new Error(message)), defaultReplies);
}

export function givenATrainerWithAFailingExplorer(message: string): TestTrainer {
  return build((_test, move) => defaultVerdict(move), () => Promise.reject(new Error(message)));
}

export function whenYouStart(test: TestTrainer, rating: number) {
  try {
    test.trainer.start(rating);
  } catch (error) {
    test.error = error;
  }
}

export async function whenYouPlay(test: TestTrainer, move: string) {
  await test.trainer.yourMove(move);
}

export function whenYouStartToPlay(test: TestTrainer, move: string) {
  void test.trainer.yourMove(move);
}

export async function whenTheEngineAnswers(test: TestTrainer, verdict: Verdict) {
  test.answerEngine?.(verdict);
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

export function thenTheEngineWasNotAsked(test: TestTrainer) {
  expect(test.engineCalls).toEqual([]);
}

export function thenTheEngineWasAskedWith(test: TestTrainer, fen: string, move: string) {
  expect(test.engineCalls).toEqual([{ fen, move }]);
}

export function thenTheExplorerWasAskedWith(test: TestTrainer, fen: string, rating: number) {
  expect(test.explorerCalls[0]).toEqual({ fen, rating });
}

export function thenTheExplorerWasAskedTimes(test: TestTrainer, times: number) {
  expect(test.explorerCalls).toHaveLength(times);
}

export function thenTheLineIs(test: TestTrainer, expected: Partial<LineView>) {
  expect(test.bus.ask(new CurrentLine())).toMatchObject(expected);
}

export function thenTheViewWasShown(test: TestTrainer, times: number) {
  expect(test.shown.count).toBe(times);
}

export function thenYouGetTheError(test: TestTrainer, message: string) {
  expect(test.error).toEqual(new Error(message));
}
