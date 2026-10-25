import { Chess } from "chess.js";
import type { QueryHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { ExploreMoves, Status } from "../messages.ts";

const WAITING: Status[] = ["checkingPosition", "checkingYourMove", "waitingForReply"];

export class ExploreMovesHandler implements QueryHandler<ExploreMoves> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(query: ExploreMoves) {
    const { status, current, nodes } = this.#state;
    const moves = new Map<string, string[]>();
    const node = nodes.get(query.at);
    if (!node || WAITING.includes(status)) return moves;
    if (query.at === current && (status === "yourMove" || status === "tryAgain")) return moves;
    for (const { from, to } of new Chess(node.fen).moves({ verbose: true })) {
      const targets = moves.get(from) ?? [];
      if (!targets.includes(to)) moves.set(from, [...targets, to]);
    }
    return moves;
  }
}
