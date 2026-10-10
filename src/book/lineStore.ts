import type { Side } from "./side.ts";

export type Line = { side: Side; moves: string[] };

export type LineStore = {
  add(line: Line): void;
  readAll(): Line[];
};

export function sameLine(a: Line, b: Line) {
  return a.side === b.side && a.moves.length === b.moves.length && a.moves.every((move, index) => move === b.moves[index]);
}
