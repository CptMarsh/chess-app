import type { Accuracy, PlayedMove, Status } from "../line/messages.ts";

const STATUS_TEXT: Record<Status, string> = {
  yourMove: "your move",
  tryAgain: "try again",
  checkingPosition: "checking the position",
  checkingYourMove: "checking your move",
  waitingForReply: "waiting for the reply",
  ended: "line ended",
};

export function readNumber(text: string): number {
  return text.trim() === "" ? Number.NaN : Number(text);
}

export type MoveCell = { index: number; san: string; percent: number | null };
export type MoveRow = { number: number; white: MoveCell; black: MoveCell | null };

export function moveRows(moves: Pick<PlayedMove, "san" | "percent">[]): MoveRow[] {
  const cells = moves.map(({ san, percent }, index) => ({ index, san, percent }));
  const rows: MoveRow[] = [];
  for (let index = 0; index < cells.length; index += 2) {
    rows.push({ number: index / 2 + 1, white: cells[index], black: cells[index + 1] ?? null });
  }
  return rows;
}

export function statusText(status: Status): string {
  return STATUS_TEXT[status];
}

const MATE = 10000;
const NO_VALUE = "\u2013";

export function barText(centipawns: number | null): string {
  if (centipawns === null) return "";
  if (Math.abs(centipawns) === MATE) return "M";
  return (Math.round(Math.abs(centipawns) / 10) / 10).toFixed(1);
}

export function evalBarPercent(centipawns: number): number {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * centipawns)) - 1);
}

export function barEval(evals: (number | null)[], position: number): number | null {
  return evals.slice(0, position + 1).findLast((value) => value !== null) ?? null;
}

export function accuracyText({ correct, checked }: Accuracy): string {
  if (checked === 0) return NO_VALUE;
  return `${correct} of ${checked} correct (${Math.round((correct / checked) * 100)}%)`;
}
