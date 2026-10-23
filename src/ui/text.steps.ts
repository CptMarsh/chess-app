import { expect } from "vitest";
import type { Status } from "../line/messages.ts";
import { moveList, readRating, statusText } from "./text.ts";

export function thenTheRatingIs(text: string, rating: number) {
  expect(readRating(text)).toBe(rating);
}

export function thenTheMoveListIs(moves: string[], text: string) {
  expect(moveList(moves)).toBe(text);
}

export function thenTheStatusTextIs(status: Status, text: string) {
  expect(statusText(status)).toBe(text);
}
