import { Chess } from "chess.js";
import { expect } from "vitest";
import { attachLine } from "../line/line.ts";
import { CurrentLine, LineBus, type Candidate, type Color, type LineView, type MoveNode, type Reply } from "../line/messages.ts";
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
  answerScore?: (score: Candidate) => void;
  answerExplorer?: (replies: Reply[]) => void;
};

const DEFAULT_REPLIES = ["e7e5", "b8c6", "a7a6", "g8f6"];
const SAN: Record<string, string> = { e7e5: "e5", b8c6: "Nc6", a7a6: "a6", g8f6: "Nf6" };

function build(
  analyse: (test: TestTrainer, fen: string) => Promise<Candidate[]>,
  score: (test: TestTrainer) => Promise<Candidate>,
  replies: (test: TestTrainer) => Promise<Reply[]>,
  failingShow?: Error,
): TestTrainer {
  const bus = new LineBus();
  attachLine(bus, () => 0);
  const test = { bus, analyseCalls: [], scoreCalls: [], explorerCalls: [], shown: { count: 0 } } as unknown as TestTrainer;
  const engine = {
    analyse: (fen: string) => {
      test.analyseCalls.push(fen);
      return analyse(test, fen);
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

// The test engine likes g1f3. When g1f3 is not legal, it takes the first legal move.
const defaultAnalysis = (_test: TestTrainer, fen: string) => {
  const moves = new Chess(fen).moves({ verbose: true }).map(({ lan }) => lan);
  const move = moves.includes("g1f3") ? "g1f3" : moves[0];
  return Promise.resolve([{ move, score: 0, line: [move] }]);
};
const scoreOf = (test: TestTrainer, score: number, line?: string[]): Candidate => {
  const { move } = test.scoreCalls.at(-1)!;
  return { move, score, line: line ?? [move] };
};
const defaultScore = (test: TestTrainer) => Promise.resolve(scoreOf(test, 0));

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

export function givenATrainerThatScores(score: number, line?: string[]): TestTrainer {
  return build(defaultAnalysis, (test) => Promise.resolve(scoreOf(test, score, line)), defaultReplies);
}

export function givenATrainerWhoseAnalysisFailsAfter(calls: number, message: string): TestTrainer {
  return build((test, fen) => test.analyseCalls.length > calls ? Promise.reject(new Error(message)) : defaultAnalysis(test, fen), defaultScore, defaultReplies);
}

export function givenATrainerWithCandidates(candidates: Candidate[]): TestTrainer {
  return build(() => Promise.resolve(candidates), defaultScore, defaultReplies);
}

export function givenATrainerThatHoldsItsAnswers(): TestTrainer {
  return build(
    (test) => new Promise<Candidate[]>((resolve) => { test.answerAnalysis = resolve; }),
    (test) => new Promise<Candidate>((resolve) => { test.answerScore = resolve; }),
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
  test.answerScore?.(scoreOf(test, score));
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

function mainSans(line: LineView): string[] {
  const sans: string[] = [];
  let at = line.nodes.find((node) => node.parent === null)!.id;
  for (let next = line.nodes.find((node) => node.parent === at && node.main); next; next = line.nodes.find((node) => node.parent === at && node.main)) {
    sans.push(next.san);
    at = next.id;
  }
  return sans;
}

export function thenTheLineIs(test: TestTrainer, expected: Partial<Omit<LineView, "nodes">> & { moves?: string[] }) {
  const line = test.bus.ask(new CurrentLine());
  expect({ ...line, moves: mainSans(line) }).toMatchObject(expected);
}

function idOf(test: TestTrainer, sans: string[]): number {
  const { nodes } = test.bus.ask(new CurrentLine());
  let at = nodes.find((node) => node.parent === null)!.id;
  for (const san of sans) at = nodes.find((node) => node.parent === at && node.san === san)!.id;
  return at;
}

export async function whenYouExplore(test: TestTrainer, after: string[], move: string) {
  await test.trainer.exploreMove(idOf(test, after), move);
}

export function thenTheNodeIs(test: TestTrainer, sans: string[], expected: Partial<MoveNode>) {
  expect(test.bus.ask(new CurrentLine()).nodes.find((node) => node.id === idOf(test, sans))).toMatchObject(expected);
}

export function thenTheVariationIs(test: TestTrainer, after: string[], sans: string[]) {
  const { nodes } = test.bus.ask(new CurrentLine());
  const found: string[] = [];
  let at = idOf(test, after);
  for (let node = nodes.find((child) => child.parent === at && !child.main); node; node = nodes.find((child) => child.parent === at)) {
    found.push(node.san);
    at = node.id;
  }
  expect(found).toEqual(sans);
}

export function thenTheViewWasShown(test: TestTrainer, times: number) {
  expect(test.shown.count).toBe(times);
}

export function thenYouGetTheError(test: TestTrainer, message: string) {
  expect(test.error).toEqual(new Error(message));
}

export async function whenYouExamine(test: TestTrainer, after: string[], times = 1) {
  const at = idOf(test, after);
  await Promise.all(Array.from({ length: times }, () => test.trainer.examine(at)));
}

export async function whenYouExploreAndExamineTheNewPosition(test: TestTrainer, after: string[], move: string) {
  const exploration = test.trainer.exploreMove(idOf(test, after), move);
  const examination = test.trainer.examine(idOf(test, [...after, new Chess(fenAfterSans(test, after)).move(uciOf(move)).san]));
  await Promise.all([exploration, examination]);
}

function fenAfterSans(test: TestTrainer, sans: string[]): string {
  const at = idOf(test, sans);
  return test.bus.ask(new CurrentLine()).nodes.find((node) => node.id === at)!.fen;
}

function uciOf(move: string) {
  return { from: move.slice(0, 2), to: move.slice(2, 4), promotion: move[4] };
}
