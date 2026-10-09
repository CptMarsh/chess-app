import type { LineAdded } from "../events.ts";
import type { Projection } from "../projection.ts";
import { bySide, type Side } from "../side.ts";

export class BookState implements Projection {
  private readonly lines = bySide(() => new Set<string>());

  has(side: Side, moves: string[]) {
    return this.lines[side].has(moves.join(" "));
  }

  apply(event: LineAdded) {
    this.lines[event.side].add(event.moves.join(" "));
  }
}
