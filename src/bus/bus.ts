export type Ack = { commandId: string };

type Message = { type: string };

type OfType<M extends Message, T> = Extract<M, { type: T }>;

export type Bus<Command extends Message, Query extends Message, Answers extends Record<Query["type"], unknown>> = {
  onCommand<T extends Command["type"]>(type: T, listener: (command: OfType<Command, T>) => void): void;
  onQuery<T extends Query["type"]>(type: T, listener: (query: OfType<Query, T>) => Answers[T]): void;
  send(command: Command): Ack;
  ask<Q extends Query>(query: Q): Answers[Q["type"]];
};

export function createBus<
  Command extends Message,
  Query extends Message,
  Answers extends Record<Query["type"], unknown>,
>(): Bus<Command, Query, Answers> {
  const commandListeners = new Map<string, (command: Command) => void>();
  const queryListeners = new Map<string, (query: Query) => unknown>();

  function attach<L>(listeners: Map<string, L>, type: string, listener: L) {
    if (listeners.has(type)) throw new Error(`The type ${type} already has a listener.`);
    listeners.set(type, listener);
  }

  return {
    onCommand: (type, listener) => attach(commandListeners, type, listener as (command: Command) => void),
    onQuery: (type, listener) => attach(queryListeners, type, listener as (query: Query) => unknown),
    send(command) {
      const commandId = crypto.randomUUID();
      commandListeners.get(command.type)?.(command);
      return { commandId };
    },
    ask: (query) => queryListeners.get(query.type)?.(query) as Answers[typeof query.type],
  };
}
