import { expect } from "vitest";
import type { Candidate } from "../line/messages.ts";
import { StockfishEngine } from "./engine.ts";

type Answers = { search: string[]; searchmoves?: string[] };
type TestEngine = {
  engine: StockfishEngine;
  commands: string[];
  candidates?: Candidate[];
  score?: Candidate;
  error?: unknown;
};

class FakeWorker extends EventTarget {
  readonly #commands: string[];
  readonly #answer: (command: string) => Event[];
  readonly #badFen: string | undefined;

  constructor(commands: string[], answer: (command: string) => Event[], badFen?: string) {
    super();
    this.#commands = commands;
    this.#answer = answer;
    this.#badFen = badFen;
  }

  postMessage(command: string) {
    if (command === `position fen ${this.#badFen}`) throw new Error("The fen is bad.");
    this.#commands.push(command);
    queueMicrotask(() => this.#answer(command).forEach((event) => this.dispatchEvent(event)));
  }
}

function lines(...texts: string[]): Event[] {
  return texts.map((data) => new MessageEvent("message", { data }));
}

export function givenAnEngineThatAnswers(answers: Answers): TestEngine {
  return givenAnEngineThatFailsOnTheFen(undefined, answers);
}

export function givenAnEngineThatFailsOnTheFen(badFen: string | undefined, answers: Answers): TestEngine {
  const commands: string[] = [];
  const answer = (command: string): Event[] => {
    if (command === "uci") return lines("uciok");
    if (command === "isready") return lines("readyok");
    if (command === "go depth 16") return lines(...answers.search);
    if (command.startsWith("go depth 16 searchmoves ")) return lines(...(answers.searchmoves ?? []));
    return [];
  };
  return { engine: new StockfishEngine(new FakeWorker(commands, answer, badFen)), commands };
}

export function givenAnEngineWhoseWorkerFails(): TestEngine {
  const commands: string[] = [];
  return { engine: new StockfishEngine(new FakeWorker(commands, () => [new Event("error")])), commands };
}

export async function whenYouAskForAnAnalysis(test: TestEngine, fen: string) {
  test.error = undefined;
  try {
    test.candidates = await test.engine.analyse(fen);
  } catch (error) {
    test.error = error;
  }
}

export async function whenYouAskForTheScoreOf(test: TestEngine, fen: string, move: string) {
  try {
    test.score = await test.engine.score(fen, move);
  } catch (error) {
    test.error = error;
  }
}

export async function whenYouAskForAnAnalysisAndAScoreAtOnce(test: TestEngine, fen: string, move: string) {
  await Promise.all([whenYouAskForAnAnalysis(test, fen), whenYouAskForTheScoreOf(test, fen, move)]);
}

export function thenTheCandidatesAre(test: TestEngine, candidates: Candidate[]) {
  expect(test.error).toBeUndefined();
  expect(test.candidates).toEqual(candidates);
}

export function thenTheScoreIs(test: TestEngine, score: Candidate) {
  expect(test.error).toBeUndefined();
  expect(test.score).toEqual(score);
}

export function thenTheCommandsWere(test: TestEngine, commands: string[]) {
  expect(test.commands).toEqual(commands);
}

export function thenTheErrorIs(test: TestEngine, message: string) {
  expect(test.error).toEqual(new Error(message));
}
