import { Chess } from "chess.js";
import type { Accuracy, Arrow, Color, Status } from "./messages.ts";

export class LineState {
  chess = new Chess();
  color: Color = "white";
  status: Status = "ended";
  message = "";
  arrow: Arrow | null = null;
  eval: number | null = null;
  yourMoves = 0;
  lineLength = 0;
  percents: (number | null)[] = [];
  accuracy: Accuracy = { correct: 0, checked: 0 };

  toWhiteSide(score: number): number {
    return this.color === "white" ? score : -score;
  }

  end(text: string) {
    this.status = "ended";
    this.message = [this.message, text].filter((part) => part !== "").join(" ");
  }
}
