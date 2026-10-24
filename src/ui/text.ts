import type { Accuracy, PlayedMove, Status } from "../line/messages.ts";

const STATUS_TEXT: Record<Status, string> = {
  yourMove: "your move",
  checkingPosition: "checking the position",
  checkingYourMove: "checking your move",
  waitingForReply: "waiting for the reply",
  ended: "line ended",
};

export function readNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

export function moveList(moves: PlayedMove[]): string {
  return moves
    .map(({ san, percent }, index) => {
      const move = percent === null ? san : `${san} (${percent}%)`;
      return index % 2 === 0 ? `${index / 2 + 1}. ${move}` : move;
    })
    .join(" ");
}

export function statusText(status: Status): string {
  return STATUS_TEXT[status];
}

const MATE = 10000;
const NO_VALUE = "\u2013";

export function evalText(centipawns: number | null): string {
  if (centipawns === null) return NO_VALUE;
  if (centipawns === MATE) return "mate for White";
  if (centipawns === -MATE) return "mate for Black";
  const pawns = Math.round(centipawns / 10) / 10;
  if (pawns === 0) return "0.0";
  return `${pawns > 0 ? "+" : ""}${pawns.toFixed(1)}`;
}

export function evalBarPercent(centipawns: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
}

export function evalBarHeight(centipawns: number | null, moveCount: number, last: number): number {
  if (centipawns !== null) return evalBarPercent(centipawns);
  return moveCount === 0 ? 50 : last;
}

export function accuracyText({ correct, checked }: Accuracy): string {
  if (checked === 0) return NO_VALUE;
  return `${correct} of ${checked} correct (${Math.round((correct / checked) * 100)}%)`;
}
