import { CurrentLine, JudgeYourMove, PlayReply, PlayYourMove, StartLine, StopLine, type LineBus, type Reply, type Verdict } from "../line/messages.ts";

export type Engine = { judge(fen: string, move: string): Promise<Verdict> };
export type Explorer = { replies(fen: string, rating: number): Promise<Reply[]> };

export class Trainer {
  readonly #bus: LineBus;
  readonly #engine: Engine;
  readonly #explorer: Explorer;
  readonly #show: () => void;
  #rating = 0;

  constructor(bus: LineBus, engine: Engine, explorer: Explorer, show: () => void) {
    this.#bus = bus;
    this.#engine = engine;
    this.#explorer = explorer;
    this.#show = show;
  }

  start(rating: number): void {
    this.#bus.send(new StartLine(rating));
    this.#rating = rating;
    this.#show();
  }

  async yourMove(move: string): Promise<void> {
    const fenBefore = this.#bus.ask(new CurrentLine()).fen;
    this.#bus.send(new PlayYourMove(move));
    this.#show();
    try {
      if (this.#bus.ask(new CurrentLine()).status === "checkingYourMove") {
        const verdict = await this.#engine.judge(fenBefore, move);
        this.#bus.send(new JudgeYourMove(verdict));
        this.#show();
      }
      const line = this.#bus.ask(new CurrentLine());
      if (line.status === "ended") return;
      const replies = await this.#explorer.replies(line.fen, this.#rating);
      this.#bus.send(new PlayReply(replies));
      this.#show();
    } catch (error) {
      this.#bus.send(new StopLine(error instanceof Error ? error.message : String(error)));
      this.#show();
    }
  }
}
