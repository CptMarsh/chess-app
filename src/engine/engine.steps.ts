import { expect } from "vitest";
import { type Analysis, StockfishEngine } from "./engine.ts";

type Answers = { search: string[]; searchmoves?: string[] };
type TestEngine = {
  engine: StockfishEngine;
  commands: string[];
  analysis?: Analysis;
  score?: number;
  error?: unknown;
};

class FakeWorker extends EventTarget {
  readonly #commands: string[];
  readonly #answer: (command: string) => Event[];

  constructor(commands: string[], answer: (command: string) => Event[]) {
    super();
    this.#commands = commands;
    this.#answer = answer;
  }

  postMessage(command: string) {
    this.#commands.push(command);
    queueMicrotask(() => this.#answer(command).forEach((event) => this.dispatchEvent(event)));
  }
}

function lines(...texts: string[]): Event[] {
  return texts.map((data) => new MessageEvent("message", { data }));
}

export function givenAnEngineThatAnswers(answers: Answers): TestEngine {
  const commands: string[] = [];
  const answer = (command: string): Event[] => {
    if (command === "uci") return lines("uciok");
    if (command === "isready") return lines("readyok");
    if (command === "go depth 16") return lines(...answers.search);
    if (command.startsWith("go depth 16 searchmoves ")) return lines(...(answers.searchmoves ?? []));
    return [];
  };
  return { engine: new StockfishEngine(new FakeWorker(commands, answer)), commands };
}

export function givenAnEngineWhoseWorkerFails(): TestEngine {
  const commands: string[] = [];
  return { engine: new StockfishEngine(new FakeWorker(commands, () => [new Event("error")])), commands };
}

export async function whenYouAskForAnAnalysis(test: TestEngine, fen: string) {
  try {
    test.analysis = await test.engine.analyse(fen);
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

export function thenTheAnalysisIs(test: TestEngine, analysis: Analysis) {
  expect(test.error).toBeUndefined();
  expect(test.analysis).toEqual(analysis);
}

export function thenTheScoreIs(test: TestEngine, score: number) {
  expect(test.error).toBeUndefined();
  expect(test.score).toEqual(score);
}

export function thenTheCommandsWere(test: TestEngine, commands: string[]) {
  expect(test.commands).toEqual(commands);
}

export function thenTheErrorIs(test: TestEngine, message: string) {
  expect(test.error).toEqual(new Error(message));
}
