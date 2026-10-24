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

  async analyse(fen: string): Promise<Candidate[]> {
    await this.#ready;
    this.#worker.postMessage(`setoption name MultiPV value ${LINES}`);
    this.#worker.postMessage("ucinewgame");
    await this.#ask("isready", "readyok");
    const candidates = new Map<number, Candidate>();
    for (const line of await this.#search(fen, `go depth ${DEPTH}`)) {
      const found = / multipv (\d+) .* pv (\S+)/.exec(line);
      const score = scoreOf(line);
      if (found && score !== undefined) candidates.set(Number(found[1]), { move: found[2], score });
    }
    return [...candidates].sort(([a], [b]) => a - b).map(([, candidate]) => candidate);
  }

  async score(fen: string, move: string): Promise<number> {
    await this.#ready;
    let score = 0;
    for (const line of await this.#search(fen, `go depth ${DEPTH} searchmoves ${move}`)) score = scoreOf(line) ?? score;
    return score;
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
