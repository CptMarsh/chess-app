import type { Verdict } from "../line/messages.ts";

export type EngineWorker = Pick<Worker, "postMessage" | "addEventListener">;

const DEPTH = 16;
const MATE = 10000;
const NOT_STARTED = "The engine did not start. Reload the page.";

type Search = { bestMove: string; score: number };
type Waiting = { onLine: (line: string) => void; onFailure: () => void };

export class StockfishEngine {
  readonly #worker: EngineWorker;
  readonly #ready: Promise<string[]>;
  #waiting: Waiting | undefined;
  #failed = false;

  constructor(worker: EngineWorker) {
    this.#worker = worker;
    worker.addEventListener("message", (event) => this.#waiting?.onLine(String((event as MessageEvent).data)));
    worker.addEventListener("error", () => {
      this.#failed = true;
      this.#waiting?.onFailure();
    });
    this.#ready = this.#ask("uci", "uciok");
    this.#ready.catch(() => {});
  }

  async judge(fen: string, move: string): Promise<Verdict> {
    await this.#ready;
    this.#worker.postMessage("ucinewgame");
    await this.#ask("isready", "readyok");
    const best = await this.#search(fen, `go depth ${DEPTH}`);
    if (move === best.bestMove) {
      return { bestMove: best.bestMove, bestScore: best.score, yourScore: best.score };
    }
    const yours = await this.#search(fen, `go depth ${DEPTH} searchmoves ${move}`);
    return { bestMove: best.bestMove, bestScore: best.score, yourScore: yours.score };
  }

  async #search(fen: string, go: string): Promise<Search> {
    this.#worker.postMessage(`position fen ${fen}`);
    const lines = await this.#ask(go, "bestmove");
    let score = 0;
    for (const line of lines) {
      const found = / score (cp|mate) (-?\d+)/.exec(line);
      if (found) score = found[1] === "cp" ? Number(found[2]) : Number(found[2]) > 0 ? MATE : -MATE;
    }
    return { bestMove: lines[lines.length - 1].split(" ")[1], score };
  }

  #ask(command: string, last: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (this.#failed) {
        reject(new Error(NOT_STARTED));
        return;
      }
      const lines: string[] = [];
      this.#waiting = {
        onLine: (line) => {
          lines.push(line);
          if (line === last || line.startsWith(`${last} `)) {
            this.#waiting = undefined;
            resolve(lines);
          }
        },
        onFailure: () => {
          this.#waiting = undefined;
          reject(new Error(NOT_STARTED));
        },
      };
      this.#worker.postMessage(command);
    });
  }
}
