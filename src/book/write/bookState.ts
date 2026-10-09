import type { LineAdded, Side } from "../events.ts";

export class BookState {
  private readonly lines = { white: new Set<string>(), black: new Set<string>() };

  has(side: Side, moves: string[]) {
    return this.lines[side].has(moves.join(" "));
  }

  apply(event: LineAdded) {
    this.lines[event.side].add(event.moves.join(" "));
  }
}
