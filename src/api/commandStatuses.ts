import { sideName, type Side } from "../book/side.ts";
import type { Outcome } from "../book/write/processor.ts";
import { Status, type ApiResponse } from "./response.ts";

export type CommandStatus = ApiResponse<{ commandId: string } | { side: Side; moves: string[] } | { message: string }>;

function statusOf(outcome: Outcome): CommandStatus {
  switch (outcome.kind) {
    case "added":
      return { status: Status.Created, body: { side: outcome.event.side, moves: outcome.event.moves } };
    case "noSide":
      return {
        status: Status.UnprocessableContent,
        body: { message: 'Add [Orientation "white"] or [Orientation "black"] to the PGN.' },
      };
    case "duplicate":
      return { status: Status.Conflict, body: { message: `The ${sideName(outcome.side)} book already has this line.` } };
    case "failed":
      return { status: Status.InternalServerError, body: { message: String(outcome.error) } };
  }
}

export class CommandStatuses {
  private readonly statuses = new Map<string, CommandStatus>();

  accept(commandId: string) {
    this.statuses.set(commandId, { status: Status.Accepted, body: { commandId } });
  }

  report(commandId: string, outcome: Outcome) {
    this.statuses.set(commandId, statusOf(outcome));
  }

  get(commandId: string): CommandStatus {
    return this.statuses.get(commandId) ?? { status: Status.NotFound, body: { message: `No command has the id ${commandId}.` } };
  }
}
