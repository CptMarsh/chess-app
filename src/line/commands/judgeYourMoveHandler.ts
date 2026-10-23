import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { JudgeYourMove } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

const ALLOWED_LOSS = 20;
const MATE = 10000;
const LINE_LENGTH = 5;

export class JudgeYourMoveHandler implements CommandHandler<JudgeYourMove> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: JudgeYourMove) {
    const state = this.#state;
    const { bestMove, bestScore, yourScore } = command.verdict;
    const played = state.chess.history({ verbose: true }).at(-1)!;
    if (played.lan === bestMove) {
      state.message = "Best move.";
    } else {
      state.chess.undo();
      const best = state.chess.move(uciMove(bestMove));
      const loss = bestScore - yourScore;
      if (loss <= ALLOWED_LOSS) {
        state.chess.undo();
        state.chess.move(played.san);
        state.message = `Good. The best move was ${best.san}.`;
      } else if (yourScore === -MATE) {
        state.message = `${played.san} allows mate. The best move is ${best.san}.`;
        state.arrow = { from: best.from, to: best.to };
      } else if (bestScore === MATE) {
        state.message = `${played.san} misses a mate. The best move is ${best.san}.`;
        state.arrow = { from: best.from, to: best.to };
      } else {
        state.message = `${played.san} loses ${(loss / 100).toFixed(1)} pawns. The best move is ${best.san}.`;
        state.arrow = { from: best.from, to: best.to };
      }
    }
    if (state.chess.isCheckmate()) {
      state.end("Checkmate.");
    } else if (state.yourMoves === LINE_LENGTH) {
      state.end("");
    } else {
      state.status = "waitingForReply";
    }
  }
}
