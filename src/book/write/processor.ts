import type { CommandStatuses } from "../../api/commandStatuses.ts";
import type { EventStore } from "../eventStore.ts";
import type { LineAdded } from "../events.ts";
import { addPgn } from "./addPgn.ts";
import type { BookState } from "./bookState.ts";
import type { Command } from "./commands.ts";
import type { Scheduler } from "./schedulers.ts";

type Queued = { commandId: string; command: Command };

export function createProcessor(
  eventStore: EventStore,
  state: BookState,
  apply: (event: LineAdded) => void,
  statuses: CommandStatuses,
  scheduler: Scheduler,
) {
  const queue: Queued[] = [];

  function runCommand({ commandId, command }: Queued) {
    try {
      const result = addPgn(command, state);
      if (!("type" in result)) {
        statuses.record(commandId, { status: result.status, body: { message: result.message } });
        return;
      }
      eventStore.append(result);
      apply(result);
      statuses.record(commandId, { status: 201, body: { side: result.side, moves: result.moves } });
    } catch (error) {
      statuses.record(commandId, { status: 500, body: { message: String(error) } });
    }
  }

  function runQueue() {
    for (let next = queue.shift(); next; next = queue.shift()) runCommand(next);
  }

  return {
    enqueue(commandId: string, command: Command) {
      queue.push({ commandId, command });
      scheduler.schedule(runQueue);
    },
  };
}
