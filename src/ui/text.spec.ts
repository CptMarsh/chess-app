import { test } from "vitest";
import type { Status } from "../line/messages.ts";
import {
  thenTheAccuracyTextIs, thenTheBarEvalIs, thenTheBarTextIs, thenTheEvalBarPercentIs, thenTheMoveListIs, thenTheMoveRowsAre, thenThePathEvalsAre,
  thenThePgnIs, thenTheRatingIs, thenTheStatusTextIs, type TestNode,
} from "./text.steps.ts";

test.each(["", "  "])("The empty rating %j is not a number", (text) => thenTheRatingIs(text, Number.NaN));
test("The rating 1450 is read as 1450", () => thenTheRatingIs("1450", 1450));
const LINE: TestNode[] = [[0, null, "", true], [1, 0, "e2e4", true], [2, 1, "e7e5", true, 42], [3, 2, "g1f3", true]];

test("The moves of White give rows", () => thenTheMoveRowsAre(LINE, [
  { number: 1, white: { id: 1, san: "e4", percent: null }, black: { id: 2, san: "e5", percent: 42 } },
  { number: 2, white: { id: 3, san: "Nf3", percent: null }, black: null },
]));
test("The moves of Black give rows", () => thenTheMoveRowsAre(
  [[0, null, "", true], [1, 0, "e2e4", true, 52], [2, 1, "e7e5", true]],
  [{ number: 1, white: { id: 1, san: "e4", percent: 52 }, black: { id: 2, san: "e5", percent: null } }]));
test("No moves give no rows", () => thenTheMoveRowsAre([[0, null, "", true]], []));
test("A variation of a White move comes after its row", () => thenTheMoveRowsAre([...LINE, [4, 2, "f1c4", false], [5, 4, "g8f6", false]], [
  { number: 1, white: { id: 1, san: "e4", percent: null }, black: { id: 2, san: "e5", percent: 42 } },
  { number: 2, white: { id: 3, san: "Nf3", percent: null }, black: null },
  { tokens: ["(", { id: 4, number: "2.", san: "Bc4" }, { id: 5, number: "", san: "Nf6" }, ")"] },
]));
test("A variation of a Black move comes after its row", () => thenTheMoveListIs(
  [...LINE, [4, 1, "c7c5", false], [5, 4, "g1f3", false]], "1. e4 e5 (42%) (1... c5 2. Nf3) 2. Nf3"));
test("A variation of the first move comes after the first row", () => thenTheMoveListIs(
  [...LINE, [4, 0, "d2d4", false]], "1. e4 e5 (42%) (1. d4) 2. Nf3"));
test("Each variation is in its own parentheses", () => thenTheMoveListIs(
  [...LINE, [4, 1, "c7c5", false], [5, 1, "e7e6", false]], "1. e4 e5 (42%) (1... c5) (1... e6) 2. Nf3"));
test("A variation at the current position comes after the last row", () => thenTheMoveListIs(
  [...LINE, [4, 3, "b8c6", false], [5, 4, "f1b5", false]], "1. e4 e5 (42%) 2. Nf3 (2... Nc6 3. Bb5)"));
test("A variation at the start position without rows is the first line", () => thenTheMoveListIs(
  [[0, null, "", true], [1, 0, "e2e4", false], [2, 1, "e7e5", false]], "(1. e4 e5)"));
test("A nested variation comes after the move that it is an alternative to", () => thenTheMoveListIs(
  [...LINE, [4, 2, "f1c4", false], [5, 4, "g8f6", false], [6, 4, "b8c6", false], [7, 6, "d2d3", false], [8, 5, "d2d3", false]],
  "1. e4 e5 (42%) 2. Nf3 (2. Bc4 Nf6 (2... Nc6 3. d3) 3. d3)"));
test("A Black move after a nested variation has its number", () => thenTheMoveListIs(
  [...LINE, [4, 2, "f1c4", false], [5, 4, "g8f6", false], [6, 5, "d2d3", false], [7, 5, "b1c3", false], [8, 6, "f8c5", false]],
  "1. e4 e5 (42%) 2. Nf3 (2. Bc4 Nf6 3. d3 (3. Nc3) 3... Bc5)"));
test("No moves give the PGN *", () => thenThePgnIs([[0, null, "", true]], "*"));
test("The main line gives its PGN", () => thenThePgnIs(LINE, "1. e4 e5 2. Nf3 *"));
test("A variation of a White move comes right after the move", () => thenThePgnIs(
  [...LINE, [4, 2, "f1c4", false], [5, 4, "g8f6", false], [6, 3, "b8c6", true]], "1. e4 e5 2. Nf3 (2. Bc4 Nf6) 2... Nc6 *"));
test("A variation of a Black move comes right after the move", () => thenThePgnIs(
  [...LINE, [4, 1, "c7c5", false], [5, 4, "g1f3", false]], "1. e4 e5 (1... c5 2. Nf3) 2. Nf3 *"));
test("A variation of the first move comes right after the first move", () => thenThePgnIs(
  [...LINE, [4, 0, "d2d4", false]], "1. e4 (1. d4) 1... e5 2. Nf3 *"));
test("A nested variation comes right after the move that it is an alternative to", () => thenThePgnIs(
  [...LINE, [4, 2, "f1c4", false], [5, 4, "g8f6", false], [6, 4, "b8c6", false], [7, 6, "d2d3", false], [8, 5, "d2d3", false]],
  "1. e4 e5 2. Nf3 (2. Bc4 Nf6 (2... Nc6 3. d3) 3. d3) *"));
test("The evals of a path go from the start position to the node", () => thenThePathEvalsAre(
  [[0, null, "", true, null, 20], [1, 0, "e2e4", true, null, null], [2, 1, "e7e5", true, 42, 30], [3, 1, "c7c5", false, null, 50]], 3, [20, null, 50]));
test.each([
  ["yourMove", "your move"], ["tryAgain", "try again"], ["checkingPosition", "checking the position"], ["checkingYourMove", "checking your move"],
  ["waitingForReply", "waiting for the reply"], ["ended", "line ended"],
])("The status %s is shown as %j", (status, text) => thenTheStatusTextIs(status as Status, text));
test.each([[null, ""], [10000, "M"], [-10000, "M"], [30, "0.3"], [-120, "1.2"], [0, "0.0"], [-4, "0.0"]])(
  "The eval %s is shown on the bar as %j", (centipawns, text) => thenTheBarTextIs(centipawns, text));
test.each([[0, 50], [10000, 100], [-10000, 0], [300, 75.11], [-300, 24.89]])(
  "The eval %i fills %f% of the bar", (centipawns, percent) => thenTheEvalBarPercentIs(centipawns, percent));
test.each([[[30, null, 50], 50], [[30, null], 30], [[30], 30], [[null, null], null], [[], null]])(
  "The evals %j give %s on the bar", (evals, shown) => thenTheBarEvalIs(evals, shown));
test.each([
  [{ correct: 0, checked: 0 }, "\u2013"], [{ correct: 7, checked: 9 }, "7 of 9 correct (78%)"],
  [{ correct: 0, checked: 1 }, "0 of 1 correct (0%)"], [{ correct: 2, checked: 3 }, "2 of 3 correct (67%)"],
])("The accuracy %j is shown as %j", (accuracy, text) => thenTheAccuracyTextIs(accuracy, text));
