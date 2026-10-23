import { expect } from "vitest";
import { attachLine } from "./line.ts";
import { CurrentLine, LineBus, PlayYourMove, StartLine, type LineView } from "./messages.ts";

type TestLine = { bus: LineBus; error?: unknown };

export function givenNoLine(random = 0): TestLine {
  const bus = new LineBus();
  attachLine(bus, () => random);
  return { bus };
}

export function givenANewLine(rating: number, random = 0): TestLine {
  const line = givenNoLine(random);
  line.bus.send(new StartLine(rating));
  return line;
}

export function whenYouStartALine(line: TestLine, rating: number) {
  try {
    line.bus.send(new StartLine(rating));
  } catch (error) {
    line.error = error;
  }
}

export function whenYouPlay(line: TestLine, move: string) {
  line.bus.send(new PlayYourMove(move));
}

export function thenTheLineIs(line: TestLine, expected: Partial<LineView>) {
  expect(line.bus.ask(new CurrentLine())).toMatchObject(expected);
}

export function thenTheLegalMovesFrom(line: TestLine, square: string, targets: string[]) {
  const moves = line.bus.ask(new CurrentLine()).legalMoves.get(square) ?? [];
  expect([...moves].sort()).toEqual([...targets].sort());
}

export function thenThereAreNoLegalMoves(line: TestLine) {
  expect(line.bus.ask(new CurrentLine()).legalMoves.size).toBe(0);
}

export function thenYouGetTheError(line: TestLine, message: string) {
  expect(line.error).toEqual(new Error(message));
}
