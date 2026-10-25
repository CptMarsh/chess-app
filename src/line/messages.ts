import { Bus, Query } from "../bus/bus.ts";

export type Color = "white" | "black";
export type Status = "yourMove" | "tryAgain" | "checkingPosition" | "checkingYourMove" | "waitingForReply" | "ended";
export type Arrow = { from: string; to: string };
export type Candidate = { move: string; score: number; line: string[] };
export type Verdict = { candidates: Candidate[]; yourScore: number; yourLine: string[] };
export type Reply = { uci: string; san: string; games: number; percent: number };
export type MoveNode = {
  id: number;
  parent: number | null;
  uci: string;
  san: string;
  fen: string;
  percent: number | null;
  eval: number | null;
  main: boolean;
};
export type Accuracy = { correct: number; checked: number };
export type LineView = {
  fen: string;
  color: Color;
  nodes: MoveNode[];
  current: number;
  status: Status;
  message: string;
  arrows: Arrow[];
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

export class PlayVariationMove {
  readonly at: number;
  readonly move: string;

  constructor(at: number, move: string) {
    this.at = at;
    this.move = move;
  }
}

export class JudgeVariationPosition {
  readonly at: number;
  readonly score: number;

  constructor(at: number, score: number) {
    this.at = at;
    this.score = score;
  }
}

export class DeleteVariation {
  readonly at: number;

  constructor(at: number) {
    this.at = at;
  }
}

export class CurrentLine extends Query<LineView> {}

export class ExploreMoves extends Query<Map<string, string[]>> {
  readonly at: number;

  constructor(at: number) {
    super();
    this.at = at;
  }
}

export class LineBus extends Bus<
  StartLine | JudgePosition | PlayYourMove | JudgeYourMove | PlayReply | StopLine | PlayVariationMove | JudgeVariationPosition | DeleteVariation,
  CurrentLine | ExploreMoves
> {}
