import { Chess } from "chess.js";
import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { PlayVariationMove } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

const MATE = 10000;

export class PlayVariationMoveHandler implements CommandHandler<PlayVariationMove> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: PlayVariationMove) {
    const state = this.#state;
    const at = state.nodes.get(command.at);
    if (!at) return;
    const chess = new Chess(at.fen);
    const move = chess.move(uciMove(command.move));
    if (at.children.some((id) => state.nodes.get(id)!.uci === move.lan)) return;
    const value = chess.isCheckmate() ? (move.color === "w" ? MATE : -MATE) : chess.isStalemate() ? 0 : null;
    state.add({ parent: at.id, uci: move.lan, san: move.san, fen: move.after, percent: null, eval: value, lines: value === null ? null : [], main: false });
  }
}
