import { test } from "vitest";
import type { Status } from "../line/messages.ts";
import {
  thenTheAccuracyTextIs, thenTheEvalBarHeightIs, thenTheEvalBarPercentIs, thenTheEvalTextIs, thenTheMoveListIs, thenTheRatingIs, thenTheStatusTextIs,
} from "./text.steps.ts";

test.each(["", "  "])("The empty rating %j is not a number", (text) => thenTheRatingIs(text, Number.NaN));
test("The rating 1450 is read as 1450", () => thenTheRatingIs("1450", 1450));
test("The moves get move numbers and the % of the opponent", () => thenTheMoveListIs(
  [{ san: "e4", percent: null }, { san: "e5", percent: 42 }, { san: "Nf3", percent: null }], "1. e4 e5 (42%) 2. Nf3"));
test("The % of the opponent follows a White move when you play Black", () => thenTheMoveListIs(
  [{ san: "e4", percent: 52 }, { san: "e5", percent: null }], "1. e4 (52%) e5"));
test.each([
  ["yourMove", "your move"], ["checkingPosition", "checking the position"], ["checkingYourMove", "checking your move"],
  ["waitingForReply", "waiting for the reply"], ["ended", "line ended"],
])("The status %s is shown as %j", (status, text) => thenTheStatusTextIs(status as Status, text));
test.each([
  [null, "\u2013"], [10000, "mate for White"], [-10000, "mate for Black"],
  [30, "+0.3"], [-120, "-1.2"], [0, "0.0"], [-4, "0.0"], [4, "0.0"],
])("The eval %s is shown as %j", (centipawns, text) => thenTheEvalTextIs(centipawns, text));
test.each([[0, 50], [10000, 100], [-10000, 0], [300, 75.11], [-300, 24.89]])(
  "The eval %i fills %f% of the bar", (centipawns, percent) => thenTheEvalBarPercentIs(centipawns, percent));
test("A known eval sets the bar", () => thenTheEvalBarHeightIs(300, 4, 20, 75.11));
test("With no eval and no moves, the bar is at 50", () => thenTheEvalBarHeightIs(null, 0, 80, 50));
test("With no eval during a line, the bar keeps its height", () => thenTheEvalBarHeightIs(null, 3, 80, 80));
test.each([
  [{ correct: 0, checked: 0 }, "\u2013"], [{ correct: 7, checked: 9 }, "7 of 9 correct (78%)"],
  [{ correct: 0, checked: 1 }, "0 of 1 correct (0%)"], [{ correct: 2, checked: 3 }, "2 of 3 correct (67%)"],
])("The accuracy %j is shown as %j", (accuracy, text) => thenTheAccuracyTextIs(accuracy, text));
