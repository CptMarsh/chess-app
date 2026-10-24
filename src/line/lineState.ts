import { Chess } from "chess.js";
import type { Accuracy, Arrow, Candidate, Color, Status } from "./messages.ts";

export class LineState {
  chess = new Chess();
  color: Color = "white";
  status: Status = "ended";
  message = "";
  arrows: Arrow[] = [];
  acceptable: Candidate[] = [];
  evals: (number | null)[] = [null];
  yourMoves = 0;
  lineLength = 0;
  percents: (number | null)[] = [];
  accuracy: Accuracy = { correct: 0, checked: 0 };

  get eval(): number | null {
    return this.evals.at(-1)!;
  }

  set eval(value: number | null) {
    this.evals[this.evals.length - 1] = value;
  }

  toWhiteSide(score: number): number {
    return this.color === "white" ? score : -score;
  }

  afterYourMove() {
    if (this.chess.isCheckmate()) {
      this.end("Checkmate.");
    } else if (this.yourMoves === this.lineLength) {
      this.end("");
    } else {
      this.status = "waitingForReply";
    }
  }

  end(text: string) {
    this.status = "ended";
    this.message = [this.message, text].filter((part) => part !== "").join(" ");
  }
}
