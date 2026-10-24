import { CurrentLine, JudgePosition, JudgeYourMove, PlayReply, PlayYourMove, StartLine, StopLine, type Candidate, type Color, type LineBus, type Reply } from "../line/messages.ts";

export type Engine = { analyse(fen: string): Promise<Candidate[]>; score(fen: string, move: string): Promise<number> };
export type Explorer = { replies(fen: string, rating: number): Promise<Reply[]> };

export class Trainer {
  readonly #bus: LineBus;
  readonly #engine: Engine;
  readonly #explorer: Explorer;
  readonly #show: () => void;
  #rating = 0;
  #candidates: Candidate[] = [];

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
        const yourScore = candidates.find((candidate) => candidate.move === move)?.score ?? await this.#engine.score(fenBefore, move);
        this.#bus.send(new JudgeYourMove({ candidates, yourScore }));
        this.#show();
      }
      await this.#prepare();
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
