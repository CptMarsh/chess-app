import { Chessground } from "chessground";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import type { Key } from "chessground/types";
import { CurrentLine, type Color, type LineBus } from "../line/messages.ts";
import type { Trainer } from "../trainer/trainer.ts";
import { keptView, nextView, viewOf } from "./navigation.ts";
import { accuracyText, barEval, barText, evalBarPercent, moveRows, readNumber, statusText, type MoveCell } from "./text.ts";
import "@fontsource/karla/400.css";
import "@fontsource/karla/600.css";
import "@fontsource/jetbrains-mono/600.css";
import "./darkwood.css";
import "./trainer.css";

const NAVIGATION_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

export function mountTrainer(root: HTMLElement, bus: LineBus, trainer: Pick<Trainer, "start" | "yourMove">): () => void {
  root.innerHTML = `
    <div id="boardRow">
      <div id="evalBar"><div id="evalBarWhite"></div><span id="evalBarText"></span></div>
      <div id="board"></div>
    </div>
    <div id="panel">
      <div id="settings">
        <label>Rating <input id="rating"></label>
        <label>Color <select><option value="white">White</option><option value="black">Black</option></select></label>
        <label>Moves <input id="movesField" value="10"></label>
        <button>New line</button>
      </div>
      <div id="moveList"></div>
      <p id="message"></p>
      <p id="accuracy"></p>
      <p id="status"></p>
    </div>
  `;
  const rating = root.querySelector<HTMLInputElement>("#rating")!;
  const movesField = root.querySelector<HTMLInputElement>("#movesField")!;
  const color = root.querySelector("select")!;
  const newLine = root.querySelector("button")!;
  const moveList = root.querySelector<HTMLElement>("#moveList")!;
  const message = root.querySelector<HTMLElement>("#message")!;
  const accuracy = root.querySelector<HTMLElement>("#accuracy")!;
  const evalBar = root.querySelector<HTMLElement>("#evalBar")!;
  const evalBarWhite = root.querySelector<HTMLElement>("#evalBarWhite")!;
  const evalBarText = root.querySelector<HTMLElement>("#evalBarText")!;
  const status = root.querySelector<HTMLElement>("#status")!;
  let viewed: number | null = null;
  let shownCount = 0;

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

  const show = () => {
    const line = bus.ask(new CurrentLine());
    viewed = keptView(viewed, shownCount, line.moves.length);
    shownCount = line.moves.length;
    const atCurrent = viewed === null;
    const fen = viewed === null ? line.fen : viewed === 0 ? "start" : line.moves[viewed - 1].fen;
    const canMove = atCurrent && (line.status === "yourMove" || line.status === "tryAgain");
    board.set({
      fen,
      orientation: line.color,
      lastMove: undefined,
      turnColor: fen.split(" ")[1] === "b" ? "black" : "white",
      movable: { color: canMove ? line.color : undefined, dests: (atCurrent ? line.legalMoves : new Map()) as Map<Key, Key[]> },
    });
    board.setAutoShapes(atCurrent ? line.arrows.map(({ from, to }) => ({ orig: from as Key, dest: to as Key, brush: "green" })) : []);
    moveList.replaceChildren(...moveRows(line.moves).map((row) => {
      const element = document.createElement("div");
      element.className = "row";
      element.append(Object.assign(document.createElement("span"), { className: "number", textContent: `${row.number}.` }));
      element.append(moveCell(row.white), ...(row.black ? [moveCell(row.black)] : []));
      return element;
    }));
    const viewedMove = moveList.querySelector<HTMLElement>(`[data-index="${(viewed ?? line.moves.length) - 1}"]`);
    viewedMove?.classList.add("viewed");
    viewedMove?.scrollIntoView({ block: "nearest" });
    message.textContent = line.message;
    const shownEval = barEval([line.startEval, ...line.moves.map((move) => move.eval)], viewed ?? line.moves.length);
    evalBar.classList.toggle("black", line.color === "black");
    evalBarWhite.style.height = `${shownEval === null ? 50 : evalBarPercent(shownEval)}%`;
    evalBarText.textContent = barText(shownEval);
    evalBarText.className = shownEval === null || shownEval >= 0 ? "whiteEnd" : "blackEnd";
    accuracy.textContent = `Accuracy: ${accuracyText(line.accuracy)}`;
    status.textContent = `Status: ${statusText(line.status)}`;
    newLine.disabled = line.status !== "yourMove" && line.status !== "tryAgain" && line.status !== "ended";
  };

  document.addEventListener("keydown", (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (!NAVIGATION_KEYS.includes(event.key)) return;
    event.preventDefault();
    viewed = nextView(event.key, viewed, shownCount);
    show();
  });

  moveList.addEventListener("click", (event) => {
    const move = (event.target as HTMLElement).closest<HTMLElement>(".move");
    if (!move) return;
    viewed = viewOf(Number(move.dataset.index) + 1, shownCount);
    show();
  });

  return show;
}

function moveCell({ index, san, percent }: MoveCell): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "move";
  cell.dataset.index = String(index);
  cell.append(
    Object.assign(document.createElement("span"), { className: "san", textContent: san }),
    Object.assign(document.createElement("span"), { className: "percent", textContent: percent === null ? "" : `${percent}%` }),
  );
  return cell;
}
