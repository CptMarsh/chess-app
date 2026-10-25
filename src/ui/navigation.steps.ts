import { expect } from "vitest";
import { treeOf, type TestNode } from "./text.steps.ts";
import { childOf, keptView, nextView, viewOf } from "./navigation.ts";

export function thenTheNextViewIs(key: string, viewed: number | null, nodes: TestNode[], current: number, result: number | null) {
  expect(nextView(key, viewed, treeOf(nodes), current)).toBe(result);
}

export function thenTheViewOfIs(id: number, current: number, result: number | null) {
  expect(viewOf(id, current)).toBe(result);
}

export function thenTheKeptViewIs(viewed: number | null, shownCurrent: number, current: number, result: number | null) {
  expect(keptView(viewed, shownCurrent, current)).toBe(result);
}

export function thenTheChildIs(nodes: TestNode[], at: number, uci: string, result: number | undefined) {
  expect(childOf(treeOf(nodes), at, uci)).toBe(result);
}
