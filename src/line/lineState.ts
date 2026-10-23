import { Chess } from "chess.js";
import type { Arrow, Status } from "./messages.ts";

export class LineState {
  chess = new Chess();
  status: Status = "ended";
  message = "";
  arrow: Arrow | null = null;
  yourMoves = 0;

  end(text: string) {
    this.status = "ended";
    this.message = [this.message, text].filter((part) => part !== "").join(" ");
  }
}
