import { Chessground } from "chessground";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import type { Key } from "chessground/types";
import { CurrentLine, type Color, type LineBus } from "../line/messages.ts";
import type { Trainer } from "../trainer/trainer.ts";
import { accuracyText, evalBarHeight, evalText, moveList, readNumber, statusText } from "./text.ts";
import "./trainer.css";

export function mountTrainer(root: HTMLElement, bus: LineBus, trainer: Pick<Trainer, "start" | "yourMove">): () => void {
  root.innerHTML = `
    <label>Rating <input id="rating"></label>
    <label>Color <select><option value="white">White</option><option value="black">Black</option></select></label>
    <label>Moves <input id="movesField" value="10"></label>
    <button>New line</button>
    <div id="boardRow">
      <div id="evalBar"><div id="evalBarWhite"></div></div>
      <div id="board"></div>
    </div>
    <p id="moves"></p>
    <p id="message"></p>
    <p id="eval"></p>
    <p id="accuracy"></p>
    <p id="status"></p>
  `;
  const rating = root.querySelector<HTMLInputElement>("#rating")!;
  const movesField = root.querySelector<HTMLInputElement>("#movesField")!;
  const color = root.querySelector("select")!;
  const newLine = root.querySelector("button")!;
  const moves = root.querySelector<HTMLElement>("#moves")!;
  const message = root.querySelector<HTMLElement>("#message")!;
  const evaluation = root.querySelector<HTMLElement>("#eval")!;
  const accuracy = root.querySelector<HTMLElement>("#accuracy")!;
  const evalBar = root.querySelector<HTMLElement>("#evalBar")!;
  const evalBarWhite = root.querySelector<HTMLElement>("#evalBarWhite")!;
  const status = root.querySelector<HTMLElement>("#status")!;
  let barHeight = 50;

  const board = Chessground(root.querySelector<HTMLElement>("#board")!, {
    orientation: "white",
    movable: {
      free: false,
      events: {
        after: (orig, dest) => {
          const promotion = board.state.pieces.get(dest)?.role === "pawn" && (dest[1] === "8" || dest[1] === "1") ? "q" : "";
          void trainer.yourMove(orig + dest + promotion);
        },
      },
    },
  });

  newLine.addEventListener("click", () => {
    trainer.start(readNumber(rating.value), color.value as Color, readNumber(movesField.value)).catch((error: Error) => {
      message.textContent = error.message;
    });
  });

  return () => {
    const line = bus.ask(new CurrentLine());
    board.set({
      fen: line.fen,
      orientation: line.color,
      lastMove: undefined,
      turnColor: line.fen.split(" ")[1] === "w" ? "white" : "black",
      movable: { color: line.status === "yourMove" ? line.color : undefined, dests: line.legalMoves as Map<Key, Key[]> },
    });
    board.setAutoShapes(line.arrow ? [{ orig: line.arrow.from as Key, dest: line.arrow.to as Key, brush: "green" }] : []);
    moves.textContent = moveList(line.moves);
    message.textContent = line.message;
    barHeight = evalBarHeight(line.eval, line.moves.length, barHeight);
    evalBar.classList.toggle("black", line.color === "black");
    evalBarWhite.style.height = `${barHeight}%`;
    evaluation.textContent = `Eval: ${evalText(line.eval)}`;
    accuracy.textContent = `Accuracy: ${accuracyText(line.accuracy)}`;
    status.textContent = `Status: ${statusText(line.status)}`;
    newLine.disabled = line.status !== "yourMove" && line.status !== "ended";
  };
}
