import { Chess } from "chess.js";
import type { Accuracy, Arrow, Candidate, Color, MoveNode, Status } from "./messages.ts";
import { uciMove } from "./uciMove.ts";

export type TreeNode = MoveNode & { children: number[] };

export class LineState {
  chess = new Chess();
  color: Color = "white";
  status: Status = "ended";
  message = "";
  arrows: Arrow[] = [];
  acceptable: Candidate[] = [];
  yourMoves = 0;
  lineLength = 0;
  accuracy: Accuracy = { correct: 0, checked: 0 };
  nodes = new Map<number, TreeNode>();
  root = 0;
  current = 0;
  #nextId = 0;

  constructor() {
    this.newTree();
  }

  get eval(): number | null {
    return this.nodes.get(this.current)!.eval;
  }

  set eval(value: number | null) {
    this.nodes.get(this.current)!.eval = value;
  }

  toWhiteSide(score: number): number {
    return this.color === "white" ? score : -score;
  }

  newTree() {
    this.nodes = new Map();
    this.root = this.add({ parent: null, uci: "", san: "", fen: this.chess.fen(), percent: null, eval: null, main: true });
    this.current = this.root;
  }

  add(node: Omit<MoveNode, "id">): number {
    const id = this.#nextId++;
    this.nodes.set(id, { ...node, id, children: [] });
    if (node.parent !== null) {
      const parent = this.nodes.get(node.parent)!;
      if (node.main) parent.children.unshift(id);
      else parent.children.push(id);
    }
    return id;
  }

  playMain(uci: string, percent: number | null) {
    const move = this.chess.move(uciMove(uci));
    this.current = this.add({ parent: this.current, uci: move.lan, san: move.san, fen: move.after, percent, eval: null, main: true });
  }

  remove(id: number) {
    const node = this.nodes.get(id)!;
    for (const child of node.children) this.remove(child);
    this.nodes.delete(id);
    if (node.parent !== null) {
      const parent = this.nodes.get(node.parent);
      if (parent) parent.children = parent.children.filter((child) => child !== id);
    }
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

