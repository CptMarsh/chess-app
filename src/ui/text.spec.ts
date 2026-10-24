import { test } from "vitest";
import type { Status } from "../line/messages.ts";
import {
  thenTheAccuracyTextIs, thenTheBarEvalIs, thenTheBarTextIs, thenTheEvalBarPercentIs, thenTheMoveRowsAre, thenTheRatingIs, thenTheStatusTextIs,
} from "./text.steps.ts";

test.each(["", "  "])("The empty rating %j is not a number", (text) => thenTheRatingIs(text, Number.NaN));
test("The rating 1450 is read as 1450", () => thenTheRatingIs("1450", 1450));
test("The moves of White give rows", () => thenTheMoveRowsAre(
  [{ san: "e4", percent: null }, { san: "e5", percent: 42 }, { san: "Nf3", percent: null }],
  [{ number: 1, white: { index: 0, san: "e4", percent: null }, black: { index: 1, san: "e5", percent: 42 } },
   { number: 2, white: { index: 2, san: "Nf3", percent: null }, black: null }]));
test("The moves of Black give rows", () => thenTheMoveRowsAre(
  [{ san: "e4", percent: 52 }, { san: "e5", percent: null }],
  [{ number: 1, white: { index: 0, san: "e4", percent: 52 }, black: { index: 1, san: "e5", percent: null } }]));
test("No moves give no rows", () => thenTheMoveRowsAre([], []));
test.each([
  ["yourMove", "your move"], ["tryAgain", "try again"], ["checkingPosition", "checking the position"], ["checkingYourMove", "checking your move"],
  ["waitingForReply", "waiting for the reply"], ["ended", "line ended"],
])("The status %s is shown as %j", (status, text) => thenTheStatusTextIs(status as Status, text));
test.each([[null, ""], [10000, "M"], [-10000, "M"], [30, "0.3"], [-120, "1.2"], [0, "0.0"], [-4, "0.0"]])(
  "The eval %s is shown on the bar as %j", (centipawns, text) => thenTheBarTextIs(centipawns, text));
test.each([[0, 50], [10000, 100], [-10000, 0], [300, 75.11], [-300, 24.89]])(
  "The eval %i fills %f% of the bar", (centipawns, percent) => thenTheEvalBarPercentIs(centipawns, percent));
test.each([[[30, null, 50], 2, 50], [[30, null, 50], 1, 30], [[30, 40, 50], 0, 30], [[null, null], 1, null]])(
  "The evals %j at the position %i give %s on the bar", (evals, position, shown) => thenTheBarEvalIs(evals, position, shown));
test.each([
  [{ correct: 0, checked: 0 }, "\u2013"], [{ correct: 7, checked: 9 }, "7 of 9 correct (78%)"],
  [{ correct: 0, checked: 1 }, "0 of 1 correct (0%)"], [{ correct: 2, checked: 3 }, "2 of 3 correct (67%)"],
])("The accuracy %j is shown as %j", (accuracy, text) => thenTheAccuracyTextIs(accuracy, text));
