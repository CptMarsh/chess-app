import type { Accuracy, MoveNode, Status } from "../line/messages.ts";

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

export type MoveCell = { id: number; san: string; percent: number | null };
export type MoveRow = { number: number; white: MoveCell; black: MoveCell | null };
export type VariationMove = { id: number; number: string; san: string };
export type VariationToken = "(" | ")" | VariationMove;
export type VariationLine = { tokens: VariationToken[] };
export type MoveItem = MoveRow | VariationLine;

// The number of the move to a node, and if White played it. The FEN of the node gives the side to move and the fullmove number.
function moveNumber({ fen }: MoveNode): { number: number; white: boolean } {
  const [, side, , , , fullmove] = fen.split(" ");
  return side === "b" ? { number: Number(fullmove), white: true } : { number: Number(fullmove) - 1, white: false };
}

export function moveRows(nodes: MoveNode[]): MoveItem[] {
  const children = (id: number) => nodes.filter((node) => node.parent === id);
  const mainChild = (id: number) => children(id).find((node) => node.main);
  const path = [nodes.find((node) => node.parent === null)!];
  for (let next = mainChild(path[0].id); next; next = mainChild(next.id)) path.push(next);

  const variationLine = (at: MoveNode): VariationLine[] => {
    const variations = children(at.id).filter((node) => !node.main);
    if (variations.length === 0) return [];
    const tokens: VariationToken[] = [];
    const emit = (node: MoveNode, numbered: boolean, alternatives: MoveNode[]) => {
      const { number, white } = moveNumber(node);
      tokens.push({ id: node.id, number: white ? `${number}.` : numbered ? `${number}...` : "", san: node.san });
      for (const alternative of alternatives) {
        tokens.push("(");
        emit(alternative, true, []);
        tokens.push(")");
      }
      const [next, ...others] = children(node.id);
      if (next) emit(next, alternatives.length > 0, others);
    };
    for (const variation of variations) {
      tokens.push("(");
      emit(variation, true, []);
      tokens.push(")");
    }
    return [{ tokens }];
  };

  const cell = ({ id, san, percent }: MoveNode): MoveCell => ({ id, san, percent });
  const items: MoveItem[] = [];
  // The variations of a node come after the row of its main child, or after the last row when it has no main child.
  for (let index = 1; index < path.length; index += 2) {
    const black = path[index + 1];
    items.push({ number: moveNumber(path[index]).number, white: cell(path[index]), black: black ? cell(black) : null });
    for (const at of path.slice(index - 1, index + 1)) items.push(...variationLine(at));
    if (black && index + 2 >= path.length) items.push(...variationLine(black));
  }
  if (path.length === 1) items.push(...variationLine(path[0]));
  return items;
}

// The movetext of the tree in PGN, with the result "*". A variation comes right after the move that it is an alternative to.
export function pgnText(nodes: MoveNode[]): string {
  const children = (id: number) => {
    const all = nodes.filter((node) => node.parent === id);
    return [...all.filter((node) => node.main), ...all.filter((node) => !node.main)];
  };
  const tokens: string[] = [];
  const play = ([move, ...alternatives]: MoveNode[], numbered: boolean) => {
    if (!move) return;
    const { number, white } = moveNumber(move);
    tokens.push(white ? `${number}. ${move.san}` : numbered ? `${number}... ${move.san}` : move.san);
    for (const alternative of alternatives) {
      tokens.push("(");
      play([alternative], true);
      tokens.push(")");
    }
    play(children(move.id), alternatives.length > 0);
  };
  play(children(nodes.find((node) => node.parent === null)!.id), true);
  return [...tokens, "*"].join(" ").replaceAll("( ", "(").replaceAll(" )", ")");
}

export function pathEvals(nodes: MoveNode[], id: number): (number | null)[] {
  const evals: (number | null)[] = [];
  for (let node = nodes.find((found) => found.id === id); node; node = nodes.find((found) => found.id === node!.parent)) evals.unshift(node.eval);
  return evals;
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

export function barEval(evals: (number | null)[]): number | null {
  return evals.findLast((value) => value !== null) ?? null;
}

export function accuracyText({ correct, checked }: Accuracy): string {
  if (checked === 0) return NO_VALUE;
  return `${correct} of ${checked} correct (${Math.round((correct / checked) * 100)}%)`;
}

// The eval of an engine line, from the White side, with its sign. A value that rounds to 0.0 has no sign.
export function lineScore(centipawns: number): string {
  const text = barText(centipawns);
  if (text === "0.0") return text;
  return `${centipawns > 0 ? "+" : "-"}${text}`;
}

// The moves of an engine line from the position of `fen`, with PGN move numbers.
export function lineMoves(fen: string, sans: string[]): string {
  const [, side, , , , fullmove] = fen.split(" ");
  const black = side === "b" ? 1 : 0;
  return sans.map((san, index) => {
    const ply = index + black;
    const number = Number(fullmove) + Math.floor(ply / 2);
    if (ply % 2 === 0) return `${number}. ${san}`;
    return index === 0 ? `${number}... ${san}` : san;
  }).join(" ");
}
