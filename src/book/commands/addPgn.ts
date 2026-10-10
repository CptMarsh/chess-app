import { Chess } from "chess.js";
import { sameLine, type LineStore } from "../lineStore.ts";
import type { AddPgn } from "../messages.ts";
import { readSide } from "./readSide.ts";

export function addPgn(store: LineStore) {
  return (command: AddPgn) => {
    const chess = new Chess();
    chess.loadPgn(command.pgn);
    const side = readSide(chess.getHeaders().Orientation);
    if (!side) return;
    const line = { side, moves: chess.history() };
    if (store.readAll().some((other) => sameLine(other, line))) return;
    store.add(line);
  };
}
