import { Chess } from "chess.js";
import type { LineAdded } from "../events.ts";
import type { BookState } from "./bookState.ts";
import type { AddPgn } from "./commands.ts";
import { readSide } from "./readSide.ts";

export type Rejection = { status: number; message: string };

export function addPgn(command: AddPgn, state: BookState): LineAdded | Rejection {
  const chess = new Chess();
  chess.loadPgn(command.pgn);
  const side = readSide(chess.getHeaders().Orientation);
  if (!side) return { status: 422, message: 'Add [Orientation "white"] or [Orientation "black"] to the PGN.' };
  const moves = chess.history();
  if (state.has(side, moves)) {
    return { status: 409, message: `The ${side === "white" ? "White" : "Black"} book already has this line.` };
  }
  return { type: "LineAdded", v: 1, side, moves };
}
