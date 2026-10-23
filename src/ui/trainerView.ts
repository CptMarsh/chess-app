import { Chessground } from "chessground";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import type { Key } from "chessground/types";
import { CurrentLine, type LineBus } from "../line/messages.ts";
import type { Trainer } from "../trainer/trainer.ts";
import { moveList, readRating, statusText } from "./text.ts";
import "./trainer.css";

export function mountTrainer(root: HTMLElement, bus: LineBus, trainer: Pick<Trainer, "start" | "yourMove">): () => void {
  root.innerHTML = `
    <label>Rating <input></label>
    <button>New line</button>
    <div id="board"></div>
    <p id="moves"></p>
    <p id="message"></p>
    <p id="status"></p>
  `;
  const rating = root.querySelector("input")!;
  const newLine = root.querySelector("button")!;
  const moves = root.querySelector<HTMLElement>("#moves")!;
  const message = root.querySelector<HTMLElement>("#message")!;
  const status = root.querySelector<HTMLElement>("#status")!;

  const board = Chessground(root.querySelector<HTMLElement>("#board")!, {
    orientation: "white",
    movable: {
      free: false,
      events: {
        after: (orig, dest) => {
          const promotion = board.state.pieces.get(dest)?.role === "pawn" && dest[1] === "8" ? "q" : "";
          void trainer.yourMove(orig + dest + promotion);
        },
      },
    },
  });

  newLine.addEventListener("click", () => {
    try {
      trainer.start(readRating(rating.value));
    } catch (error) {
      message.textContent = (error as Error).message;
    }
  });

  return () => {
    const line = bus.ask(new CurrentLine());
    board.set({
      fen: line.fen,
      lastMove: undefined,
      turnColor: line.fen.split(" ")[1] === "w" ? "white" : "black",
      movable: { color: line.status === "yourMove" ? "white" : undefined, dests: line.legalMoves as Map<Key, Key[]> },
    });
    board.setAutoShapes(line.arrow ? [{ orig: line.arrow.from as Key, dest: line.arrow.to as Key, brush: "green" }] : []);
    moves.textContent = moveList(line.moves);
    message.textContent = line.message;
    status.textContent = `Status: ${statusText(line.status)}`;
    newLine.disabled = line.status === "checkingYourMove" || line.status === "waitingForReply";
  };
}
