import { test } from "vitest";
import { thenTheKeptViewIs, thenTheNextViewIs, thenTheViewOfIs } from "./navigation.steps.ts";

test.each([
  ["ArrowLeft", null, 4, 3], ["ArrowLeft", 2, 4, 1], ["ArrowLeft", 0, 4, 0], ["ArrowLeft", null, 0, null],
  ["ArrowRight", 2, 4, 3], ["ArrowRight", 3, 4, null], ["ArrowRight", null, 4, null],
  ["ArrowUp", null, 4, 0], ["ArrowUp", null, 0, null], ["ArrowDown", 1, 4, null], ["Enter", 2, 4, 2],
])("%s from %s with %i moves gives %s", (key, viewed, moveCount, result) => thenTheNextViewIs(key, viewed, moveCount, result));
test.each([[2, 4, 2], [4, 4, null]])("A click on move %i of %i gives %s", (moves, moveCount, result) => thenTheViewOfIs(moves, moveCount, result));
test.each([[2, 4, 4, 2], [2, 4, 5, null], [2, 4, 3, null], [null, 4, 4, null]])(
  "The view %s with %i shown moves and %i moves now gives %s", (viewed, shown, now, result) => thenTheKeptViewIs(viewed, shown, now, result));
