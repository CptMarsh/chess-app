import { Chess } from "chess.js";
import type { LineAdded } from "../events.ts";
import type { Side } from "../side.ts";
import type { BookState } from "./bookState.ts";
import type { AddPgn } from "./commands.ts";
import { readSide } from "./readSide.ts";

export type HandlerResult =
  | { kind: "added"; event: LineAdded }
  | { kind: "noSide" }
  | { kind: "duplicate"; side: Side };

export function addPgn(command: AddPgn, state: BookState): HandlerResult {
  const chess = new Chess();
  chess.loadPgn(command.pgn);
  const side = readSide(chess.getHeaders().Orientation);
  if (!side) return { kind: "noSide" };
  const moves = chess.history();
  if (state.has(side, moves)) return { kind: "duplicate", side };
  return { kind: "added", event: { type: "LineAdded", v: 1, side, moves } };
}
