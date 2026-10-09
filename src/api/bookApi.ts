import type { Side } from "../book/events.ts";
import type { Command } from "../book/write/commands.ts";
import type { ApiResponse } from "./response.ts";

export type BookApi = {
  sendCommand(command: Command): ApiResponse<{ commandId: string } | { message: string }>;
  getCommandStatus(
    commandId: string,
  ): ApiResponse<{ commandId: string } | { side: Side; moves: string[] } | { message: string }>;
  getMovesAfter(side: Side, moves: string[]): ApiResponse<{ moves: string[] }>;
  getSummary(): ApiResponse<{ white: number; black: number }>;
};
