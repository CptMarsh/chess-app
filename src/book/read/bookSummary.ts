import type { LineAdded } from "../events.ts";

export class BookSummary {
  readonly counts = { white: 0, black: 0 };

  apply(event: LineAdded) {
    this.counts[event.side] += 1;
  }
}
