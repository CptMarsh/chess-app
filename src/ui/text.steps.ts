import { Chess } from "chess.js";
import { expect } from "vitest";
import type { Accuracy, MoveNode, Status } from "../line/messages.ts";
import { accuracyText, barEval, barText, evalBarPercent, moveRows, pathEvals, readNumber, statusText, type MoveItem } from "./text.ts";

// A node of a test tree: [id, parent, uci, main, percent, eval]. The san and the fen come from chess.js.
export type TestNode = [number, number | null, string, boolean, (number | null)?, (number | null)?];

export function treeOf(nodes: TestNode[]): MoveNode[] {
  const fens = new Map<number, string>();
  return nodes.map(([id, parent, uci, main, percent = null, value = null]) => {
    if (parent === null) {
      fens.set(id, new Chess().fen());
      return { id, parent, uci: "", san: "", fen: fens.get(id)!, percent, eval: value, main };
    }
    const move = new Chess(fens.get(parent)).move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci[4] });
    fens.set(id, move.after);
    return { id, parent, uci, san: move.san, fen: move.after, percent, eval: value, main };
  });
}

// The text of the move list, as the e2e step reads it.
function textOf(items: MoveItem[]): string {
  return items.map((item) => {
    if ("tokens" in item) {
      return item.tokens.map((token) => typeof token === "string" ? token : [token.number, token.san].filter((part) => part !== "").join(" "))
        .join(" ").replaceAll("( ", "(").replaceAll(" )", ")");
    }
    const cell = (move: { san: string; percent: number | null }) => move.percent === null ? move.san : `${move.san} (${move.percent}%)`;
    return [`${item.number}.`, cell(item.white), ...(item.black ? [cell(item.black)] : [])].join(" ");
  }).join(" ");
}

export function thenTheRatingIs(text: string, rating: number) {
  expect(readNumber(text)).toBe(rating);
}

export function thenTheMoveRowsAre(nodes: TestNode[], items: MoveItem[]) {
  expect(moveRows(treeOf(nodes))).toEqual(items);
}

export function thenTheMoveListIs(nodes: TestNode[], text: string) {
  expect(textOf(moveRows(treeOf(nodes)))).toBe(text);
}

export function thenThePathEvalsAre(nodes: TestNode[], id: number, evals: (number | null)[]) {
  expect(pathEvals(treeOf(nodes), id)).toEqual(evals);
}

export function thenTheStatusTextIs(status: Status, text: string) {
  expect(statusText(status)).toBe(text);
}

export function thenTheBarTextIs(centipawns: number | null, text: string) {
  expect(barText(centipawns)).toBe(text);
}

export function thenTheEvalBarPercentIs(centipawns: number, percent: number) {
  expect(evalBarPercent(centipawns)).toBeCloseTo(percent, 2);
}

export function thenTheBarEvalIs(evals: (number | null)[], shown: number | null) {
  expect(barEval(evals)).toBe(shown);
}

export function thenTheAccuracyTextIs(accuracy: Accuracy, text: string) {
  expect(accuracyText(accuracy)).toBe(text);
}
