import { Chess, type Move } from "chess.js";
import type { CommandHandler } from "../../bus/bus.ts";
import type { LineState } from "../lineState.ts";
import type { JudgeYourMove } from "../messages.ts";
import { uciMove } from "../uciMove.ts";

const ALLOWED_LOSS = 20;
const MATE = 10000;
const REFUTATION_MOVES = 6;

export class JudgeYourMoveHandler implements CommandHandler<JudgeYourMove> {
  readonly #state: LineState;

  constructor(state: LineState) {
    this.#state = state;
  }

  handle(command: JudgeYourMove) {
    const state = this.#state;
    const { candidates, yourScore, yourLine } = command.verdict;
    const { move: bestMove, score: bestScore } = candidates[0];
    const played = state.chess.history({ verbose: true }).at(-1)!;
    const loss = bestScore - yourScore;
    if (played.lan !== bestMove && loss > ALLOWED_LOSS) {
      const acceptable = candidates.filter((candidate) => bestScore - candidate.score <= ALLOWED_LOSS);
      const sans = acceptable.map((candidate) => new Chess(played.before).move(uciMove(candidate.move)).san);
      const refutation = refutationOf(played.after, yourLine);
      state.chess.undo();
      this.#keepAsVariation(refutation, state.toWhiteSide(yourScore));
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

  #keepAsVariation(refutation: Move[], value: number) {
    const state = this.#state;
    const yours = state.nodes.get(state.current)!;
    state.current = yours.parent!;
    const parent = state.nodes.get(state.current)!;
    parent.children = [...parent.children.filter((id) => id !== yours.id), yours.id];
    yours.main = false;
    yours.eval = value;
    let at = yours.id;
    for (const { lan, san, after } of refutation) {
      at = state.add({ parent: at, uci: lan, san, fen: after, percent: null, eval: value, lines: null, main: false });
    }
  }
}

function refutationOf(fen: string, yourLine: string[]): Move[] {
  const chess = new Chess(fen);
  return yourLine.slice(1, 1 + REFUTATION_MOVES).map((move) => chess.move(uciMove(move)));
}
