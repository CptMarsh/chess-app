import { Chess } from "chess.js";
import type { CommandHandler } from "../../bus/bus.ts";
import { sameLine, type LineStore } from "../lineStore.ts";
import type { AddPgn } from "../messages.ts";
import { readSide } from "./readSide.ts";

export class AddPgnHandler implements CommandHandler<AddPgn> {
  readonly #store: LineStore;

  constructor(store: LineStore) {
    this.#store = store;
  }

  handle(command: AddPgn) {
    const chess = new Chess();
    chess.loadPgn(command.pgn);
    const side = readSide(chess.getHeaders().Orientation);
    if (!side) return;
    const line = { side, moves: chess.history() };
    if (this.#store.readAll().some((other) => sameLine(other, line))) return;
    this.#store.add(line);
  }
}
