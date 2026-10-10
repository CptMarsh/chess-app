import type { BookBus } from "../book/messages.ts";
import { sideName, type Side } from "../book/side.ts";

function lineCount(side: Side, count: number) {
  return `${sideName(side)}: ${count} ${count === 1 ? "line" : "lines"}`;
}

export function mountBookInput(root: HTMLElement, bus: BookBus) {
  const pgn = document.createElement("textarea");
  const save = document.createElement("button");
  const white = document.createElement("p");
  const black = document.createElement("p");
  save.textContent = "Save";
  root.append(pgn, save, white, black);

  function showSummary() {
    const counts = bus.ask({ type: "Summary" });
    white.textContent = lineCount("white", counts.white);
    black.textContent = lineCount("black", counts.black);
  }

  save.addEventListener("click", () => {
    try {
      bus.send({ type: "AddPgn", pgn: pgn.value });
    } catch {}
    showSummary();
  });

  showSummary();
}
