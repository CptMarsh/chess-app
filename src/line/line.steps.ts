import { expect } from "vitest";
import { attachLine } from "./line.ts";
import {
  CurrentLine,
  DeleteVariation,
  ExploreMoves,
  JudgePosition,
  JudgeVariationPosition,
  JudgeYourMove,
  LineBus,
  PlayReply,
  PlayVariationMove,
  PlayYourMove,
  StartLine,
  StopLine,
  type Color,
  type LineView,
  type MoveNode,
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
      if (index > 0) line.bus.send(new JudgeYourMove({ candidates: [{ move, score: 0, line: [move] }], yourScore: 0, yourLine: [move] }));
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

function view(line: TestLine): LineView {
  return line.bus.ask(new CurrentLine());
}

function mainPath(view: LineView): MoveNode[] {
  const path = [view.nodes.find((node) => node.parent === null)!];
  for (;;) {
    const next = view.nodes.find((node) => node.parent === path.at(-1)!.id && node.main);
    if (!next) return path;
    path.push(next);
  }
}

export function thenTheLineIs(line: TestLine, expected: Partial<Omit<LineView, "nodes">> & { moves?: string[] }) {
  const shown = view(line);
  expect({ ...shown, moves: mainPath(shown).slice(1).map(({ san }) => san) }).toMatchObject(expected);
}

export function thenTheMovesAre(line: TestLine, moves: Pick<MoveNode, "san" | "percent">[]) {
  expect(mainPath(view(line)).slice(1).map(({ san, percent }) => ({ san, percent }))).toEqual(moves);
}

export function thenTheFenAfterMoveIs(line: TestLine, index: number, fen: string) {
  expect(mainPath(view(line))[index + 1].fen).toBe(fen);
}

export function thenTheEvalsAre(line: TestLine, startEval: number | null, evals: (number | null)[]) {
  const [start, ...moves] = mainPath(view(line));
  expect({ startEval: start.eval, evals: moves.map((move) => move.eval) }).toEqual({ startEval, evals });
}

export function thenTheCurrentNodeIsTheLastMainNode(line: TestLine) {
  const shown = view(line);
  expect(shown.current).toBe(mainPath(shown).at(-1)!.id);
}

export function idOf(line: TestLine, ...sans: string[]): number {
  let at = view(line).nodes.find((node) => node.parent === null)!.id;
  for (const san of sans) at = view(line).nodes.find((node) => node.parent === at && node.san === san)!.id;
  return at;
}

export function currentOf(line: TestLine): number {
  return view(line).current;
}

export function whenYouExplore(line: TestLine, at: number, move: string) {
  line.bus.send(new PlayVariationMove(at, move));
}

export function whenTheEngineExaminesTheVariation(line: TestLine, at: number, score: number) {
  line.bus.send(new JudgeVariationPosition(at, score));
}

export function whenYouDelete(line: TestLine, at: number) {
  line.bus.send(new DeleteVariation(at));
}

export function thenTheChildrenAre(line: TestLine, at: number, children: Pick<MoveNode, "san" | "main">[]) {
  expect(view(line).nodes.filter((node) => node.parent === at).map(({ san, main }) => ({ san, main }))).toEqual(children);
}

export function thenTheNodeIs(line: TestLine, at: number, expected: Partial<MoveNode>) {
  expect(view(line).nodes.find((node) => node.id === at)).toMatchObject(expected);
}

export function thenThereIsNoNode(line: TestLine, at: number) {
  expect(view(line).nodes.find((node) => node.id === at)).toBeUndefined();
}

export function thenTheNodeCountIs(line: TestLine, count: number) {
  expect(view(line).nodes).toHaveLength(count);
}

export function thenTheVariationLineIs(line: TestLine, at: number, sans: string[]) {
  const nodes = view(line).nodes;
  const found: string[] = [];
  for (let node = nodes.find((child) => child.parent === at); node; node = nodes.find((child) => child.parent === node!.id)) found.push(node.san);
  expect(found).toEqual(sans);
}

export function thenTheParentsComeFirst(line: TestLine) {
  const ids = view(line).nodes.map(({ id }) => id);
  view(line).nodes.forEach((node, index) => {
    if (node.parent !== null) expect(ids.indexOf(node.parent)).toBeLessThan(index);
  });
}

export function thenTheIdsAreNew(line: TestLine, oldIds: number[]) {
  expect(view(line).nodes.map(({ id }) => id).filter((id) => oldIds.includes(id))).toEqual([]);
}

export function idsOf(line: TestLine): number[] {
  return view(line).nodes.map(({ id }) => id);
}

export function thenTheExploreMovesFrom(line: TestLine, at: number, square: string, targets: string[]) {
  expect([...(line.bus.ask(new ExploreMoves(at)).get(square) ?? [])].sort()).toEqual([...targets].sort());
}

export function thenThereAreNoExploreMoves(line: TestLine, at: number) {
  expect(line.bus.ask(new ExploreMoves(at)).size).toBe(0);
}

export function thenTheLegalMovesFrom(line: TestLine, square: string, targets: string[]) {
  const moves = line.bus.ask(new CurrentLine()).legalMoves.get(square) ?? [];
  expect([...moves].sort()).toEqual([...targets].sort());
}

export function thenTheLegalMovesAre(line: TestLine, moves: Record<string, string[]>) {
  expect(Object.fromEntries(line.bus.ask(new CurrentLine()).legalMoves)).toEqual(moves);
}

export function thenThereAreNoLegalMoves(line: TestLine) {
  expect(line.bus.ask(new CurrentLine()).legalMoves.size).toBe(0);
}

export function thenYouGetTheError(line: TestLine, message: string) {
  expect(line.error).toEqual(new Error(message));
}
