import { PlayReplyHandler } from "./commands/playReplyHandler.ts";
import { PlayYourMoveHandler } from "./commands/playYourMoveHandler.ts";
import { StartLineHandler } from "./commands/startLineHandler.ts";
import { StopLineHandler } from "./commands/stopLineHandler.ts";
import { LineState } from "./lineState.ts";
import { CurrentLine, PlayReply, PlayYourMove, StartLine, StopLine, type LineBus } from "./messages.ts";
import { CurrentLineHandler } from "./queries/currentLineHandler.ts";

export function attachLine(bus: LineBus, random: () => number = Math.random) {
  const state = new LineState();
  bus.onCommand(StartLine, new StartLineHandler(state));
  bus.onCommand(PlayYourMove, new PlayYourMoveHandler(state));
  bus.onCommand(PlayReply, new PlayReplyHandler(state, random));
  bus.onCommand(StopLine, new StopLineHandler(state));
  bus.onQuery(CurrentLine, new CurrentLineHandler(state));
}
