import { Chessground } from "chessground";
import "chessground/assets/chessground.base.css";
import "chessground/assets/chessground.brown.css";
import "chessground/assets/chessground.cburnett.css";
import type { Key } from "chessground/types";
import { CurrentLine, DeleteVariation, ExploreMoves, type Color, type LineBus, type MoveNode, type Status } from "../line/messages.ts";
import type { Trainer } from "../trainer/trainer.ts";
import { childOf, keptView, nextView, viewOf } from "./navigation.ts";
import { accuracyText, barEval, barText, evalBarPercent, lineMoves, lineScore, moveRows, pathEvals, readNumber, statusText, type MoveCell, type VariationLine } from "./text.ts";
import "@fontsource/karla/400.css";
import "@fontsource/karla/600.css";
import "@fontsource/jetbrains-mono/600.css";
import "./darkwood.css";
import "./trainer.css";

// The statuses in which you can explore. No answer of the line is pending.
const EXPLORING: Status[] = ["yourMove", "tryAgain", "ended"];
const NAVIGATION_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
const NAVIGATION_BUTTONS = [
  { key: "ArrowUp", label: "Start", icon: "⏮" },
  { key: "ArrowLeft", label: "Back", icon: "◀" },
  { key: "ArrowRight", label: "Forward", icon: "▶" },
  { key: "ArrowDown", label: "End", icon: "⏭" },
];
const COG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>`;

type Drop = { line: true } | { line: false; at: number };

export function mountTrainer(root: HTMLElement, bus: LineBus, trainer: Pick<Trainer, "start" | "yourMove" | "exploreMove" | "examine">, changeToken: () => void): () => void {
  root.innerHTML = `
    <div id="boardRow">
      <div id="evalBar"><div id="evalBarWhite"></div><span id="evalBarText"></span></div>
      <div id="board"></div>
    </div>
    <div id="panel">
      <div id="top">
        <button id="newLine">New line</button>
        <button id="cog" popovertarget="settings" aria-label="Settings">${COG}</button>
      </div>
      <div id="settings" popover>
        <label>Rating <input id="rating"></label>
        <label>Color <select><option value="white">White</option><option value="black">Black</option></select></label>
        <label>Moves <input id="movesField" value="10"></label>
      </div>
      <div id="moveMenu" popover="manual"><button>Delete from here</button></div>
      <div id="moveList"></div>
      <div id="navigation">
        ${NAVIGATION_BUTTONS.map(({ key, label, icon }) => `<button data-key="${key}" aria-label="${label}">${icon}</button>`).join("")}
      </div>
      <div id="engineLines" hidden></div>
      <p id="message"></p>
      <p id="accuracy"></p>
      <p id="status"></p>
      <button id="changeToken">Change token</button>
    </div>
  `;
  const rating = root.querySelector<HTMLInputElement>("#rating")!;
  const movesField = root.querySelector<HTMLInputElement>("#movesField")!;
  const color = root.querySelector("select")!;
  const newLine = root.querySelector<HTMLButtonElement>("#newLine")!;
  const cog = root.querySelector<HTMLElement>("#cog")!;
  const settings = root.querySelector<HTMLElement>("#settings")!;
  const moveMenu = root.querySelector<HTMLElement>("#moveMenu")!;
  root.querySelector("#changeToken")!.addEventListener("click", changeToken);
  const moveList = root.querySelector<HTMLElement>("#moveList")!;
  const engineLines = root.querySelector<HTMLElement>("#engineLines")!;
  const message = root.querySelector<HTMLElement>("#message")!;
  const accuracy = root.querySelector<HTMLElement>("#accuracy")!;
  const evalBar = root.querySelector<HTMLElement>("#evalBar")!;
  const evalBarWhite = root.querySelector<HTMLElement>("#evalBarWhite")!;
  const evalBarText = root.querySelector<HTMLElement>("#evalBarText")!;
  const status = root.querySelector<HTMLElement>("#status")!;
  let viewed: number | null = null;
  let shownCurrent: number | null = null;
  let nodes: MoveNode[] = [];
  let drop: Drop = { line: true };
  let menuTarget: number | null = null;

  const board = Chessground(root.querySelector<HTMLElement>("#board")!, {
    orientation: "white",
    movable: {
      free: false,
      events: {
        after: (orig, dest) => {
          const promotion = board.state.pieces.get(dest)?.role === "pawn" && (dest[1] === "8" || dest[1] === "1") ? "q" : "";
          const move = orig + dest + promotion;
          if (drop.line) {
            void trainer.yourMove(move);
            return;
          }
          const { at } = drop;
          void trainer.exploreMove(at, move);
          const line = bus.ask(new CurrentLine());
          viewed = viewOf(childOf(line.nodes, at, move) ?? at, line.current);
          show();
        },
      },
    },
  });

  newLine.addEventListener("click", () => {
    trainer.start(readNumber(rating.value), color.value as Color, readNumber(movesField.value)).catch((error: Error) => {
      message.textContent = error.message;
    });
  });

  settings.addEventListener("beforetoggle", (event) => {
    if ((event as ToggleEvent).newState !== "open") return;
    const place = cog.getBoundingClientRect();
    settings.style.top = `${place.bottom + 4}px`;
    settings.style.left = `${place.right}px`;
    settings.style.translate = "-100% 0";
  });

  const show = () => {
    const line = bus.ask(new CurrentLine());
    nodes = line.nodes;
    viewed = keptView(viewed, shownCurrent ?? line.current, line.current);
    shownCurrent = line.current;
    const at = viewed ?? line.current;
    const node = nodes.find(({ id }) => id === at)!;
    const atCurrent = viewed === null;
    const lineMove = atCurrent && (line.status === "yourMove" || line.status === "tryAgain");
    drop = lineMove ? { line: true } : { line: false, at };
    const dests = lineMove ? line.legalMoves : bus.ask(new ExploreMoves(at));
    const turnColor = node.fen.split(" ")[1] === "b" ? "black" : "white";
    board.set({
      fen: node.fen,
      orientation: line.color,
      lastMove: undefined,
      turnColor,
      movable: { color: dests.size === 0 ? undefined : lineMove ? line.color : turnColor, dests: dests as Map<Key, Key[]> },
    });
    board.setAutoShapes(atCurrent ? line.arrows.map(({ from, to }) => ({ orig: from as Key, dest: to as Key, brush: "green" })) : []);
    moveList.replaceChildren(...moveRows(nodes).map((item) => "tokens" in item ? variationLine(item) : row(item)));
    const viewedMove = moveList.querySelector<HTMLElement>(`[data-id="${at}"]`);
    viewedMove?.classList.add("viewed");
    viewedMove?.scrollIntoView({ block: "nearest" });
    // Explore mode. At the current position in yourMove or tryAgain, the lines would show the answer.
    const exploring = !lineMove && EXPLORING.includes(line.status);
    engineLines.hidden = !exploring;
    if (exploring) {
      if (node.lines === null) void trainer.examine(at);
      engineLines.replaceChildren(...engineLineItems(node));
    }
    message.textContent = line.message;
    const shownEval = barEval(pathEvals(nodes, at));
    evalBar.classList.toggle("black", line.color === "black");
    evalBarWhite.style.height = `${shownEval === null ? 50 : evalBarPercent(shownEval)}%`;
    evalBarText.textContent = barText(shownEval);
    evalBarText.className = shownEval === null || shownEval >= 0 ? "whiteEnd" : "blackEnd";
    accuracy.textContent = `Accuracy: ${accuracyText(line.accuracy)}`;
    status.textContent = `Status: ${statusText(line.status)}`;
    newLine.disabled = line.status !== "yourMove" && line.status !== "tryAgain" && line.status !== "ended";
  };

  const isVariation = (id: number | null) => nodes.some((node) => node.id === id && !node.main);

  const deleteVariation = (id: number) => {
    const parent = nodes.find((node) => node.id === id)!.parent!;
    bus.send(new DeleteVariation(id));
    const line = bus.ask(new CurrentLine());
    if (!line.nodes.some((node) => node.id === viewed)) viewed = viewOf(parent, line.current);
    show();
  };

  const navigate = (key: string) => {
    viewed = nextView(key, viewed, nodes, shownCurrent!);
    show();
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") moveMenu.hidePopover();
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
    if (event.key === "Delete") {
      if (viewed !== null && isVariation(viewed)) deleteVariation(viewed);
      return;
    }
    if (!NAVIGATION_KEYS.includes(event.key)) return;
    event.preventDefault();
    navigate(event.key);
  });

  root.querySelector("#navigation")!.addEventListener("click", (event) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>("button");
    if (button) navigate(button.dataset.key!);
  });

  moveList.addEventListener("click", (event) => {
    const move = (event.target as HTMLElement).closest<HTMLElement>(".move");
    if (!move) return;
    viewed = viewOf(Number(move.dataset.id), shownCurrent!);
    show();
  });

  moveList.addEventListener("contextmenu", (event) => {
    const move = (event.target as HTMLElement).closest<HTMLElement>(".move");
    if (!move || !isVariation(Number(move.dataset.id))) return;
    event.preventDefault();
    menuTarget = Number(move.dataset.id);
    moveMenu.style.left = `${event.clientX}px`;
    moveMenu.style.top = `${event.clientY}px`;
    moveMenu.showPopover();
  });

  // The menu is a manual popover: on Linux, contextmenu comes on the mouse down, and a light dismiss would close the menu on the mouse up.
  document.addEventListener("pointerdown", (event) => {
    if (!moveMenu.contains(event.target as Node)) moveMenu.hidePopover();
  });

  moveMenu.querySelector("button")!.addEventListener("click", () => {
    moveMenu.hidePopover();
    if (menuTarget !== null && isVariation(menuTarget)) deleteVariation(menuTarget);
    menuTarget = null;
  });

  settings.showPopover();
  return show;
}

function row({ number, white, black }: { number: number; white: MoveCell; black: MoveCell | null }): HTMLElement {
  const element = document.createElement("div");
  element.className = "row";
  element.append(Object.assign(document.createElement("span"), { className: "number", textContent: `${number}.` }));
  element.append(moveCell(white), ...(black ? [moveCell(black)] : []));
  return element;
}

function moveCell({ id, san, percent }: MoveCell): HTMLElement {
  const cell = document.createElement("span");
  cell.className = "move";
  cell.dataset.id = String(id);
  cell.append(
    Object.assign(document.createElement("span"), { className: "san", textContent: san }),
    Object.assign(document.createElement("span"), { className: "percent", textContent: percent === null ? "" : `${percent}%` }),
  );
  return cell;
}

function variationLine({ tokens }: VariationLine): HTMLElement {
  const element = document.createElement("div");
  element.className = "variations";
  tokens.forEach((token, index) => {
    if (index > 0 && tokens[index - 1] !== "(" && token !== ")") element.append(" ");
    if (typeof token === "string") {
      element.append(Object.assign(document.createElement("span"), { className: "paren", textContent: token }));
      return;
    }
    const move = document.createElement("span");
    move.className = "move";
    move.dataset.id = String(token.id);
    move.append(
      Object.assign(document.createElement("span"), { className: "number", textContent: token.number }),
      Object.assign(document.createElement("span"), { className: "san", textContent: token.san }),
    );
    element.append(move);
  });
  return element;
}

function engineLineItems({ fen, lines }: MoveNode): HTMLElement[] {
  if (lines === null) return [Object.assign(document.createElement("p"), { textContent: "The engine is thinking." })];
  if (lines.length === 0) return [Object.assign(document.createElement("p"), { textContent: "No moves." })];
  return lines.map(({ eval: value, sans }) => {
    const element = document.createElement("div");
    element.className = "engineLine";
    element.append(
      Object.assign(document.createElement("span"), { className: "score", textContent: lineScore(value) }),
      Object.assign(document.createElement("span"), { className: "moves", textContent: lineMoves(fen, sans) }),
    );
    return element;
  });
}
