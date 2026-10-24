import { Bus, Query } from "../bus/bus.ts";

export type Color = "white" | "black";
export type Status = "yourMove" | "checkingPosition" | "checkingYourMove" | "waitingForReply" | "ended";
export type Arrow = { from: string; to: string };
export type Verdict = { bestMove: string; bestScore: number; yourScore: number };
export type Reply = { uci: string; san: string; games: number; percent: number };
export type PlayedMove = { san: string; percent: number | null };
export type Accuracy = { correct: number; checked: number };
export type LineView = {
  fen: string;
  color: Color;
  moves: PlayedMove[];
  status: Status;
  message: string;
  arrow: Arrow | null;
  eval: number | null;
  accuracy: Accuracy;
  legalMoves: Map<string, string[]>;
};

export class StartLine {
  readonly rating: number;
  readonly color: Color;
  readonly moves: number;

  constructor(rating: number, color: Color, moves: number) {
    this.rating = rating;
    this.color = color;
    this.moves = moves;
  }
}

export class PlayYourMove {
  readonly move: string;

  constructor(move: string) {
    this.move = move;
  }
}

export class JudgePosition {
  readonly score: number;

  constructor(score: number) {
    this.score = score;
  }
}

export class JudgeYourMove {
  readonly verdict: Verdict;

  constructor(verdict: Verdict) {
    this.verdict = verdict;
  }
}

export class PlayReply {
  readonly replies: Reply[];

  constructor(replies: Reply[]) {
    this.replies = replies;
  }
}

export class StopLine {
  readonly message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export class CurrentLine extends Query<LineView> {}

export class LineBus extends Bus<
  StartLine | JudgePosition | PlayYourMove | JudgeYourMove | PlayReply | StopLine,
  CurrentLine
> {}
