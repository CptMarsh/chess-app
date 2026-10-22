export type Ack = { commandId: string };

export abstract class Query<Answer> {
  declare readonly answer?: Answer;
}

export type AnswerOf<Q> = Q extends Query<infer Answer> ? Answer : never;

export interface CommandHandler<C> {
  handle(command: C): void;
}

export interface QueryHandler<Q extends Query<unknown>> {
  handle(query: Q): AnswerOf<Q>;
}

type MessageClass<T> = new (...args: never[]) => T;

function attach<H>(handlers: Map<Function, H>, type: Function, handler: H) {
  if (handlers.has(type)) throw new Error(`The type ${type.name} already has a listener.`);
  handlers.set(type, handler);
}

export class Bus<C extends object, Q extends Query<unknown>> {
  readonly #commandHandlers = new Map<Function, CommandHandler<C>>();
  readonly #queryHandlers = new Map<Function, QueryHandler<Q>>();

  onCommand<T extends C>(type: MessageClass<T>, handler: CommandHandler<T>) {
    attach(this.#commandHandlers, type, handler as CommandHandler<C>);
  }

  onQuery<T extends Q>(type: MessageClass<T>, handler: QueryHandler<T>) {
    attach(this.#queryHandlers, type, handler as QueryHandler<Q>);
  }

  send(command: C): Ack {
    const commandId = crypto.randomUUID();
    this.#commandHandlers.get(command.constructor)?.handle(command);
    return { commandId };
  }

  ask<T extends Q>(query: T): AnswerOf<T> {
    return this.#queryHandlers.get(query.constructor)?.handle(query) as AnswerOf<T>;
  }
}
