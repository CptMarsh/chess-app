import { Bus, Query } from "../bus/bus.ts";
import type { Side } from "./side.ts";

export class AddPgn {
  readonly pgn: string;

  constructor(pgn: string) {
    this.pgn = pgn;
  }
}

export class MovesAfter extends Query<string[]> {
  readonly side: Side;
  readonly moves: string[];

  constructor(side: Side, moves: string[]) {
    super();
    this.side = side;
    this.moves = moves;
  }
}

export class Summary extends Query<Record<Side, number>> {}

export class BookBus extends Bus<AddPgn, MovesAfter | Summary> {}
