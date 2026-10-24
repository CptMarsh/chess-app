import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { PlayReply } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

export class PlayReplyHandler implements CommandHandler<PlayReply> {
  readonly #state: LineState;
  readonly #random: () => number;

  constructor(state: LineState, random: () => number) {
    this.#state = state;
    this.#random = random;
  }

  handle(command: PlayReply) {
    const { replies } = command;
    if (replies.length === 0) {
      this.#state.end("No games at your level after this position.");
      return;
    }
    const total = replies.reduce((sum, reply) => sum + reply.games, 0);
    const target = this.#random() * total;
    let running = 0;
    const picked = replies.find((reply) => (running += reply.games) > target) ?? replies[0];
    const { uci, percent } = picked;
    this.#state.chess.move(uciMove(uci));
    this.#state.percents.push(percent);
    this.#state.evals.push(null);
    this.#state.status = "checkingPosition";
  }
}
