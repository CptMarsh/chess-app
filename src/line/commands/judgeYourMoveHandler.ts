import { Chess } from "chess.js";
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
    const { candidates, yourScore } = command.verdict;
    const { move: bestMove, score: bestScore } = candidates[0];
    const played = state.chess.history({ verbose: true }).at(-1)!;
    const loss = bestScore - yourScore;
    if (played.lan !== bestMove && loss > ALLOWED_LOSS) {
      const acceptable = candidates.filter((candidate) => bestScore - candidate.score <= ALLOWED_LOSS);
      const sans = acceptable.map((candidate) => new Chess(played.before).move(uciMove(candidate.move)).san);
      state.chess.undo();
      state.percents.pop();
      state.evals.pop();
      state.yourMoves -= 1;
      state.acceptable = acceptable;
      state.arrows = acceptable.map(({ move }) => ({ from: move.slice(0, 2), to: move.slice(2, 4) }));
      state.eval = state.toWhiteSide(bestScore);
      state.accuracy.checked += 1;
      const play = `Play ${sans.length === 1 ? sans[0] : `${sans.slice(0, -1).join(", ")} or ${sans.at(-1)}`}.`;
      if (yourScore === -MATE) {
        state.message = `${played.san} allows mate. ${play}`;
      } else if (bestScore === MATE) {
        state.message = `${played.san} misses a mate. ${play}`;
      } else {
        state.message = `${played.san} loses ${(loss / 100).toFixed(1)} pawns. ${play}`;
      }
      state.status = "tryAgain";
      return;
    }
    state.message = played.lan === bestMove ? "Best move." : `Good. The best move was ${new Chess(played.before).move(uciMove(bestMove)).san}.`;
    state.eval = state.toWhiteSide(yourScore);
    state.accuracy.checked += 1;
    state.accuracy.correct += 1;
    state.afterYourMove();
  }
}
