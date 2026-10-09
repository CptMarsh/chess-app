import { Chess } from "chess.js";
import type { LineAdded, Side } from "../events.ts";
import { positionKey } from "./positionKey.ts";

export class BookMoves {
  private readonly positions = { white: new Map<string, Set<string>>(), black: new Map<string, Set<string>>() };

  movesAfter(side: Side, moves: string[]) {
    const chess = new Chess();
    for (const move of moves) chess.move(move);
    return [...(this.positions[side].get(positionKey(chess.fen())) ?? [])];
  }

  apply(event: LineAdded) {
    const chess = new Chess();
    for (const move of event.moves) {
      const key = positionKey(chess.fen());
      const next = this.positions[event.side].get(key) ?? new Set<string>();
      next.add(move);
      this.positions[event.side].set(key, next);
      chess.move(move);
    }
  }
}
