import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { JudgeYourMove } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

const ALLOWED_LOSS = 20;
const MATE = 10000;

export class JudgeYourMoveHandler implements CommandHandler<JudgeYourMove> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: JudgeYourMove) {
    const state = this.#state;
    const { bestMove, bestScore, yourScore } = command.verdict;
    const played = state.chess.history({ verbose: true }).at(-1)!;
    const loss = bestScore - yourScore;
    let best;
    if (played.lan !== bestMove) {
      state.chess.undo();
      best = state.chess.move(uciMove(bestMove));
    }
    state.eval = state.toWhiteSide(yourScore);
    state.accuracy.checked += 1;
    if (played.lan === bestMove || loss <= ALLOWED_LOSS) state.accuracy.correct += 1;
    if (best === undefined) {
      state.message = "Best move.";
    } else {
      if (loss <= ALLOWED_LOSS) {
        state.chess.undo();
        state.chess.move(played.san);
        state.message = `Good. The best move was ${best.san}.`;
      } else {
        state.eval = state.toWhiteSide(bestScore);
        state.arrow = { from: best.from, to: best.to };
        if (yourScore === -MATE) {
          state.message = `${played.san} allows mate. The best move is ${best.san}.`;
        } else if (bestScore === MATE) {
          state.message = `${played.san} misses a mate. The best move is ${best.san}.`;
        } else {
          state.message = `${played.san} loses ${(loss / 100).toFixed(1)} pawns. The best move is ${best.san}.`;
        }
      }
    }
    if (state.chess.isCheckmate()) {
      state.end("Checkmate.");
    } else if (state.yourMoves === state.lineLength) {
      state.end("");
    } else {
      state.status = "waitingForReply";
    }
  }
}
