import type { Status } from "../line/messages.ts";

const STATUS_TEXT: Record<Status, string> = {
  yourMove: "your move",
  checkingYourMove: "checking your move",
  waitingForReply: "waiting for the reply",
  ended: "line ended",
};

export function readRating(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

export function moveList(moves: string[]): string {
  return moves.map((move, index) => (index % 2 === 0 ? `${index / 2 + 1}. ${move}` : move)).join(" ");
}

export function statusText(status: Status): string {
  return STATUS_TEXT[status];
}
