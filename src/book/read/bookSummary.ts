import type { LineAdded } from "../events.ts";
import type { Projection } from "../projection.ts";
import { bySide } from "../side.ts";

export class BookSummary implements Projection {
  private readonly lineCounts = bySide(() => 0);

  counts() {
    return { ...this.lineCounts };
  }

  apply(event: LineAdded) {
    this.lineCounts[event.side] += 1;
  }
}
