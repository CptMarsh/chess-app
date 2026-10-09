import type { Side } from "../book/events.ts";
import type { ApiResponse } from "./response.ts";

export type CommandStatus = ApiResponse<{ commandId: string } | { side: Side; moves: string[] } | { message: string }>;

export class CommandStatuses {
  private readonly statuses = new Map<string, CommandStatus>();

  record(commandId: string, status: CommandStatus) {
    this.statuses.set(commandId, status);
  }

  get(commandId: string): CommandStatus {
    return this.statuses.get(commandId) ?? { status: 404, body: { message: `No command has the id ${commandId}.` } };
  }
}
