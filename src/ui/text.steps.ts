import { expect } from "vitest";
import type { Accuracy, PlayedMove, Status } from "../line/messages.ts";
import { accuracyText, barEval, barText, evalBarPercent, moveRows, readNumber, statusText, type MoveRow } from "./text.ts";

export function thenTheRatingIs(text: string, rating: number) {
  expect(readNumber(text)).toBe(rating);
}

export function thenTheMoveRowsAre(moves: Pick<PlayedMove, "san" | "percent">[], rows: MoveRow[]) {
  expect(moveRows(moves)).toEqual(rows);
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

export function thenTheBarEvalIs(evals: (number | null)[], position: number, shown: number | null) {
  expect(barEval(evals, position)).toBe(shown);
}

export function thenTheAccuracyTextIs(accuracy: Accuracy, text: string) {
  expect(accuracyText(accuracy)).toBe(text);
}
