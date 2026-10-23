import { PlayYourMoveHandler } from "./commands/playYourMoveHandler.ts";
import { StartLineHandler } from "./commands/startLineHandler.ts";
import { LineState } from "./lineState.ts";
import { CurrentLine, PlayYourMove, StartLine, type LineBus } from "./messages.ts";
import { CurrentLineHandler } from "./queries/currentLineHandler.ts";

export function attachLine(bus: LineBus, random: () => number = Math.random) {
  const state = new LineState();
  bus.onCommand(StartLine, new StartLineHandler(state));
  bus.onCommand(PlayYourMove, new PlayYourMoveHandler(state));
  bus.onQuery(CurrentLine, new CurrentLineHandler(state));
}
