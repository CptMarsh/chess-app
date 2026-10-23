import { expect } from "vitest";
import { attachLine } from "./line.ts";
import {
  CurrentLine,
  JudgeYourMove,
  LineBus,
  PlayReply,
  PlayYourMove,
  StartLine,
  StopLine,
  type LineView,
  type Reply,
  type Verdict,
} from "./messages.ts";

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

export function givenALineAfter(moves: string[]): TestLine {
  const line = givenANewLine(1450);
  moves.forEach((move, index) => {
    if (index % 2 === 0) {
      line.bus.send(new PlayYourMove(move));
      if (index > 0) line.bus.send(new JudgeYourMove({ bestMove: move, bestScore: 0, yourScore: 0 }));
    } else {
      line.bus.send(new PlayReply([{ uci: move, san: "", games: 1 }]));
    }
  });
  return line;
}

export function whenTheEngineGives(line: TestLine, verdict: Verdict) {
  line.bus.send(new JudgeYourMove(verdict));
}

export function whenYouPlay(line: TestLine, move: string) {
  line.bus.send(new PlayYourMove(move));
}

export function whenTheReplyIsPickedFrom(line: TestLine, replies: Reply[]) {
  line.bus.send(new PlayReply(replies));
}

export function whenTheLineStops(line: TestLine, message: string) {
  line.bus.send(new StopLine(message));
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
