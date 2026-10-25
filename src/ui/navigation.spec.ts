import { test } from "vitest";
import type { TestNode } from "./text.steps.ts";
import { thenTheChildIs, thenTheKeptViewIs, thenTheNextViewIs, thenTheViewOfIs } from "./navigation.steps.ts";

// 1. e4 e5 2. Nf3 (current), with the variation (1... c5 2. Nf3) under e4.
const TREE: TestNode[] = [[0, null, "", true], [1, 0, "e2e4", true], [2, 1, "e7e5", true], [3, 2, "g1f3", true], [4, 1, "c7c5", false], [5, 4, "g1f3", false]];
const CURRENT = 3;

test.each([
  ["ArrowLeft", null, 2], ["ArrowLeft", 2, 1], ["ArrowLeft", 0, 0], ["ArrowLeft", 5, 4], ["ArrowLeft", 4, 1],
  ["ArrowRight", 1, 2], ["ArrowRight", 4, 5], ["ArrowRight", 5, 5], ["ArrowRight", null, null], ["ArrowRight", 2, null],
  ["ArrowUp", null, 0], ["ArrowUp", 5, 0], ["ArrowDown", 5, null], ["Enter", 2, 2],
])("%s from %s gives %s", (key, viewed, result) => thenTheNextViewIs(key, viewed, TREE, CURRENT, result));
test("ArrowUp without moves gives the current position", () => thenTheNextViewIs("ArrowUp", null, [[0, null, "", true]], 0, null));
test.each([[2, 3, 2], [3, 3, null]])("A click on node %i with the current node %i gives %s", (id, current, result) => thenTheViewOfIs(id, current, result));
test.each([[2, 3, 3, 2], [2, 3, 4, null], [null, 3, 3, null]])(
  "The view %s with the shown current %i and the current %i gives %s", (viewed, shown, now, result) => thenTheKeptViewIs(viewed, shown, now, result));
test.each([[1, "c7c5", 4], [1, "e7e5", 2], [4, "g1f3", 5], [4, "b1c3", undefined]])(
  "The child of %i with %s is %s", (at, uci, result) => thenTheChildIs(TREE, at, uci, result));
