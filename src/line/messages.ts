import { Bus, Query } from "../bus/bus.ts";

export type Status = "yourMove" | "checkingYourMove" | "waitingForReply" | "ended";
export type Arrow = { from: string; to: string };
export type Verdict = { bestMove: string; bestScore: number; yourScore: number };
export type Reply = { uci: string; san: string; games: number };
export type LineView = {
  fen: string;
  moves: string[];
  status: Status;
  message: string;
  arrow: Arrow | null;
  legalMoves: Map<string, string[]>;
};

export class StartLine {
  readonly rating: number;

  constructor(rating: number) {
    this.rating = rating;
  }
}

export class PlayYourMove {
  readonly move: string;

  constructor(move: string) {
    this.move = move;
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
  StartLine | PlayYourMove | JudgeYourMove | PlayReply | StopLine,
  CurrentLine
> {}
