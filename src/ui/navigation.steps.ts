import { expect } from "vitest";
import { keptView, nextView, viewOf } from "./navigation.ts";

export function thenTheNextViewIs(key: string, viewed: number | null, moveCount: number, result: number | null) {
  expect(nextView(key, viewed, moveCount)).toBe(result);
}

export function thenTheViewOfIs(moves: number, moveCount: number, result: number | null) {
  expect(viewOf(moves, moveCount)).toBe(result);
}

export function thenTheKeptViewIs(viewed: number | null, shownCount: number, moveCount: number, result: number | null) {
  expect(keptView(viewed, shownCount, moveCount)).toBe(result);
}
