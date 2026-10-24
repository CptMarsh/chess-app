import { expect } from "vitest";
import { attachLine } from "./line.ts";
import {
  CurrentLine,
  JudgePosition,
  JudgeYourMove,
  LineBus,
  PlayReply,
  PlayYourMove,
  StartLine,
  StopLine,
  type Color,
  type LineView,
  type PlayedMove,
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
  line.bus.send(new StartLine(rating, "white", 5));
  line.bus.send(new JudgePosition(0));
  return line;
}

export function whenYouStartALine(line: TestLine, rating: number, color: Color = "white", moves = 5) {
  try {
    line.bus.send(new StartLine(rating, color, moves));
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
      line.bus.send(new PlayReply([{ uci: move, san: "", games: 1, percent: 1 }]));
      line.bus.send(new JudgePosition(0));
    }
  });
  return line;
}

export function whenTheEngineExamines(line: TestLine, score: number) {
  line.bus.send(new JudgePosition(score));
}

export function whenTheEngineGives(line: TestLine, verdict: Verdict) {
  line.bus.send(new JudgeYourMove(verdict));
}

export function whenTheEngineGivesAVerdictThatThrows(line: TestLine, verdict: Verdict) {
  try {
    line.bus.send(new JudgeYourMove(verdict));
  } catch (error) {
    line.error = error;
  }
}

export function thenTheLineThrew(line: TestLine) {
  expect(line.error).toBeInstanceOf(Error);
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

export function thenTheLineIs(line: TestLine, expected: Partial<Omit<LineView, "moves">> & { moves?: string[] }) {
  const view = line.bus.ask(new CurrentLine());
  expect({ ...view, moves: view.moves.map(({ san }) => san) }).toMatchObject(expected);
}

export function thenTheMovesAre(line: TestLine, moves: PlayedMove[]) {
  expect(line.bus.ask(new CurrentLine()).moves).toEqual(moves);
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
