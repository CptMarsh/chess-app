import type { Candidate } from "../line/messages.ts";

export type EngineWorker = Pick<Worker, "postMessage" | "addEventListener">;

const DEPTH = 16;
const LINES = 3;
const MATE = 10000;
const NOT_STARTED = "The engine did not start. Reload the page.";

type Waiting = { onLine: (line: string) => void; onFailure: () => void };

export class StockfishEngine {
  readonly #worker: EngineWorker;
  readonly #ready: Promise<string[]>;
  #waiting: Waiting | undefined;
  #failed = false;
  #queue: Promise<unknown> = Promise.resolve();

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

  analyse(fen: string): Promise<Candidate[]> {
    return this.#inTurn(async () => {
      await this.#ready;
      this.#worker.postMessage(`setoption name MultiPV value ${LINES}`);
      this.#worker.postMessage("ucinewgame");
      await this.#ask("isready", "readyok");
      const candidates = new Map<number, Candidate>();
      for (const line of await this.#search(fen, `go depth ${DEPTH}`)) {
        const found = / multipv (\d+) /.exec(line);
        const score = scoreOf(line);
        const moves = lineOf(line);
        if (found && score !== undefined && moves) candidates.set(Number(found[1]), { move: moves[0], score, line: moves });
      }
      return [...candidates].sort(([a], [b]) => a - b).map(([, candidate]) => candidate);
    });
  }

  score(fen: string, move: string): Promise<Candidate> {
    return this.#inTurn(async () => {
      await this.#ready;
      let candidate: Candidate = { move, score: 0, line: [move] };
      for (const line of await this.#search(fen, `go depth ${DEPTH} searchmoves ${move}`)) {
        const score = scoreOf(line);
        if (score !== undefined) candidate = { move, score, line: lineOf(line) ?? [move] };
      }
      return candidate;
    });
  }

  #inTurn<T>(work: () => Promise<T>): Promise<T> {
    const result = this.#queue.then(work);
    this.#queue = result.catch(() => {});
    return result;
  }

  #search(fen: string, go: string): Promise<string[]> {
    this.#worker.postMessage(`position fen ${fen}`);
    return this.#ask(go, "bestmove");
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

function scoreOf(line: string): number | undefined {
  const found = / score (cp|mate) (-?\d+)/.exec(line);
  if (!found) return undefined;
  return found[1] === "cp" ? Number(found[2]) : Number(found[2]) > 0 ? MATE : -MATE;
}

function lineOf(line: string): string[] | undefined {
  return / pv (.+)$/.exec(line)?.[1].trim().split(/\s+/);
}
