import { DeleteVariationHandler } from "./commands/deleteVariationHandler.ts";
import { JudgePositionHandler } from "./commands/judgePositionHandler.ts";
import { JudgeYourMoveHandler } from "./commands/judgeYourMoveHandler.ts";
import { JudgeVariationPositionHandler } from "./commands/judgeVariationPositionHandler.ts";
import { KeepEngineLinesHandler } from "./commands/keepEngineLinesHandler.ts";
import { PlayReplyHandler } from "./commands/playReplyHandler.ts";
import { PlayVariationMoveHandler } from "./commands/playVariationMoveHandler.ts";
import { PlayYourMoveHandler } from "./commands/playYourMoveHandler.ts";
import { StartLineHandler } from "./commands/startLineHandler.ts";
import { StopLineHandler } from "./commands/stopLineHandler.ts";
import { LineState } from "./lineState.ts";
import {
  CurrentLine,
  DeleteVariation,
  ExploreMoves,
  JudgePosition,
  JudgeVariationPosition,
  JudgeYourMove,
  KeepEngineLines,
  PlayReply,
  PlayVariationMove,
  PlayYourMove,
  StartLine,
  StopLine,
  type LineBus,
} from "./messages.ts";
import { CurrentLineHandler } from "./queries/currentLineHandler.ts";
import { ExploreMovesHandler } from "./queries/exploreMovesHandler.ts";

export function attachLine(bus: LineBus, random: () => number = Math.random) {
  const state = new LineState();
  bus.onCommand(StartLine, new StartLineHandler(state));
  bus.onCommand(JudgePosition, new JudgePositionHandler(state));
  bus.onCommand(PlayYourMove, new PlayYourMoveHandler(state));
  bus.onCommand(JudgeYourMove, new JudgeYourMoveHandler(state));
  bus.onCommand(PlayReply, new PlayReplyHandler(state, random));
  bus.onCommand(StopLine, new StopLineHandler(state));
  bus.onCommand(PlayVariationMove, new PlayVariationMoveHandler(state));
  bus.onCommand(JudgeVariationPosition, new JudgeVariationPositionHandler(state));
  bus.onCommand(KeepEngineLines, new KeepEngineLinesHandler(state));
  bus.onCommand(DeleteVariation, new DeleteVariationHandler(state));
  bus.onQuery(CurrentLine, new CurrentLineHandler(state));
  bus.onQuery(ExploreMoves, new ExploreMovesHandler(state));
}
