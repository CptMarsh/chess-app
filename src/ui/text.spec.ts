import { test } from "vitest";
import type { Status } from "../line/messages.ts";
import { thenTheMoveListIs, thenTheRatingIs, thenTheStatusTextIs } from "./text.steps.ts";

test.each(["", "  "])("The empty rating %j is not a number", (text) => thenTheRatingIs(text, Number.NaN));
test("The rating 1450 is read as 1450", () => thenTheRatingIs("1450", 1450));
test("The moves get move numbers", () => thenTheMoveListIs(["e4", "e5", "Nf3"], "1. e4 e5 2. Nf3"));
test.each([
  ["yourMove", "your move"], ["checkingYourMove", "checking your move"],
  ["waitingForReply", "waiting for the reply"], ["ended", "line ended"],
])("The status %s is shown as %j", (status, text) => thenTheStatusTextIs(status as Status, text));
