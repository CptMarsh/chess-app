import {
  CurrentLine,
  JudgePosition,
  JudgeVariationPosition,
  JudgeYourMove,
  KeepEngineLines,
  PlayReply,
  PlayVariationMove,
  PlayYourMove,
  StartLine,
  StopLine,
  type Candidate,
  type Color,
  type LineBus,
  type Reply,
} from "../line/messages.ts";

export type Engine = { analyse(fen: string): Promise<Candidate[]>; score(fen: string, move: string): Promise<Candidate> };
export type Explorer = { replies(fen: string, rating: number): Promise<Reply[]> };

export class Trainer {
  readonly #bus: LineBus;
  readonly #engine: Engine;
  readonly #explorer: Explorer;
  readonly #show: () => void;
  #rating = 0;
  #candidates: Candidate[] = [];
  // The nodes that the engine examines or examined for their lines. The engine gets each node one time only.
  readonly #examined = new Set<number>();

  constructor(bus: LineBus, engine: Engine, explorer: Explorer, show: () => void) {
    this.#bus = bus;
    this.#engine = engine;
    this.#explorer = explorer;
    this.#show = show;
  }

  async start(rating: number, color: Color, moves: number): Promise<void> {
    this.#bus.send(new StartLine(rating, color, moves));
    this.#rating = rating;
    await this.#guarded(async () => {
      this.#show();
      await this.#prepare();
    });
  }

  async yourMove(move: string): Promise<void> {
    const fenBefore = this.#bus.ask(new CurrentLine()).fen;
    this.#bus.send(new PlayYourMove(move));
    await this.#guarded(async () => {
      this.#show();
      if (this.#bus.ask(new CurrentLine()).status === "checkingYourMove") {
        const candidates = this.#candidates;
        const yours = candidates.find((candidate) => candidate.move === move) ?? await this.#engine.score(fenBefore, move);
        this.#bus.send(new JudgeYourMove({ candidates, yourScore: yours.score, yourLine: yours.line }));
        this.#show();
      }
      await this.#prepare();
    });
  }

  async exploreMove(at: number, move: string): Promise<void> {
    this.#bus.send(new PlayVariationMove(at, move));
    const child = this.#bus.ask(new CurrentLine()).nodes.find((node) => node.parent === at && node.uci === move);
    const examine = child?.eval === null;
    if (examine) this.#examined.add(child.id);
    await this.#guarded(async () => {
      this.#show();
      if (examine) {
        const candidates = await this.#engine.analyse(child.fen);
        this.#bus.send(new JudgeVariationPosition(child.id, candidates[0].score));
        this.#bus.send(new KeepEngineLines(child.id, candidates));
        this.#show();
      }
    });
  }

  async examine(at: number): Promise<void> {
    const node = this.#bus.ask(new CurrentLine()).nodes.find(({ id }) => id === at);
    if (!node || node.lines !== null || this.#examined.has(at)) return;
    this.#examined.add(at);
    await this.#guarded(async () => {
      const candidates = await this.#engine.analyse(node.fen);
      this.#bus.send(new KeepEngineLines(at, candidates));
      this.#show();
    });
  }

  async #prepare(): Promise<void> {
    let line = this.#bus.ask(new CurrentLine());
    if (line.status === "waitingForReply") {
      const replies = await this.#explorer.replies(line.fen, this.#rating);
      this.#bus.send(new PlayReply(replies));
      this.#show();
      line = this.#bus.ask(new CurrentLine());
    }
    if (line.status === "checkingPosition") {
      this.#candidates = await this.#engine.analyse(line.fen);
      this.#bus.send(new JudgePosition(this.#candidates[0].score));
      this.#bus.send(new KeepEngineLines(line.current, this.#candidates));
      this.#show();
    }
  }

  async #guarded(steps: () => Promise<void>): Promise<void> {
    try {
      await steps();
    } catch (error) {
      this.#bus.send(new StopLine(error instanceof Error ? error.message : String(error)));
      this.#show();
    }
  }
}
