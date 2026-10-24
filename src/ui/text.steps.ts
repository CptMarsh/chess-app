import { expect } from "vitest";
import type { Accuracy, PlayedMove, Status } from "../line/messages.ts";
import { accuracyText, evalBarHeight, evalBarPercent, evalText, moveList, readNumber, statusText } from "./text.ts";

export function thenTheRatingIs(text: string, rating: number) {
  expect(readNumber(text)).toBe(rating);
}

export function thenTheMoveListIs(moves: PlayedMove[], text: string) {
  expect(moveList(moves)).toBe(text);
}

export function thenTheStatusTextIs(status: Status, text: string) {
  expect(statusText(status)).toBe(text);
}

export function thenTheEvalTextIs(centipawns: number | null, text: string) {
  expect(evalText(centipawns)).toBe(text);
}

export function thenTheEvalBarPercentIs(centipawns: number, percent: number) {
  expect(evalBarPercent(centipawns)).toBeCloseTo(percent, 2);
}

export function thenTheEvalBarHeightIs(centipawns: number | null, moveCount: number, last: number, height: number) {
  expect(evalBarHeight(centipawns, moveCount, last)).toBeCloseTo(height, 2);
}

export function thenTheAccuracyTextIs(accuracy: Accuracy, text: string) {
  expect(accuracyText(accuracy)).toBe(text);
}
