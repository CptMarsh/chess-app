import type { BookMoves } from "../book/read/bookMoves.ts";
import type { BookSummary } from "../book/read/bookSummary.ts";
import type { Side } from "../book/side.ts";
import type { Command } from "../book/write/commands.ts";
import type { Processor } from "../book/write/processor.ts";
import type { CommandStatus, CommandStatuses } from "./commandStatuses.ts";
import { Status, type ApiResponse } from "./response.ts";

export type BookApi = {
  sendCommand(command: Command): ApiResponse<{ commandId: string } | { message: string }>;
  getCommandStatus(commandId: string): CommandStatus;
  getMovesAfter(side: Side, moves: string[]): ApiResponse<{ moves: string[] }>;
  getSummary(): ApiResponse<{ white: number; black: number }>;
};

type Parts = {
  processor: Processor;
  statuses: CommandStatuses;
  bookMoves: BookMoves;
  bookSummary: BookSummary;
};

export function createBookApi({ processor, statuses, bookMoves, bookSummary }: Parts): BookApi {
  return {
    sendCommand(command) {
      try {
        const commandId = crypto.randomUUID();
        statuses.accept(commandId);
        processor.enqueue(commandId, command);
        return { status: Status.Accepted, body: { commandId } };
      } catch (error) {
        return { status: Status.InternalServerError, body: { message: String(error) } };
      }
    },
    getCommandStatus: (commandId) => statuses.get(commandId),
    getMovesAfter: (side, moves) => ({ status: Status.OK, body: { moves: bookMoves.movesAfter(side, moves) } }),
    getSummary: () => ({ status: Status.OK, body: bookSummary.counts() }),
  };
}
