import type { EventStore } from "../eventStore.ts";
import type { BookEvent } from "../events.ts";
import { addPgn, type HandlerResult } from "./addPgn.ts";
import type { BookState } from "./bookState.ts";
import type { Command } from "./commands.ts";
import { drain } from "./drain.ts";
import type { Scheduler } from "./schedulers.ts";

export type Outcome = HandlerResult | { kind: "failed"; error: unknown };

export type Processor = { enqueue(commandId: string, command: Command): void };

type Parts = {
  eventStore: EventStore;
  state: BookState;
  apply: (event: BookEvent) => void;
  report: (commandId: string, outcome: Outcome) => void;
  scheduler: Scheduler;
};

type Queued = { commandId: string; command: Command };

export function createProcessor({ eventStore, state, apply, report, scheduler }: Parts): Processor {
  const queue: Queued[] = [];

  function outcomeOf(command: Command): Outcome {
    try {
      const result = addPgn(command, state);
      if (result.kind === "added") {
        eventStore.append(result.event);
        apply(result.event);
      }
      return result;
    } catch (error) {
      return { kind: "failed", error };
    }
  }

  function runCommand({ commandId, command }: Queued) {
    report(commandId, outcomeOf(command));
  }

  return {
    enqueue(commandId, command) {
      queue.push({ commandId, command });
      scheduler.schedule(() => drain(queue, runCommand));
    },
  };
}
