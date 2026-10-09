import { Chess } from "chess.js";
import type { LineAdded } from "../events.ts";
import type { Projection } from "../projection.ts";
import { bySide, type Side } from "../side.ts";
import { positionKey } from "./positionKey.ts";

function replay(moves: string[]) {
  const chess = new Chess();
  const keys = moves.map((move) => {
    const key = positionKey(chess.fen());
    chess.move(move);
    return key;
  });
  return { keys, end: positionKey(chess.fen()) };
}

export class BookMoves implements Projection {
  private readonly positions = bySide(() => new Map<string, Set<string>>());

  movesAfter(side: Side, moves: string[]) {
    return [...(this.positions[side].get(replay(moves).end) ?? [])];
  }

  apply(event: LineAdded) {
    const positions = this.positions[event.side];
    replay(event.moves).keys.forEach((key, index) => {
      const next = positions.get(key) ?? new Set<string>();
      next.add(event.moves[index]);
      positions.set(key, next);
    });
  }
}
