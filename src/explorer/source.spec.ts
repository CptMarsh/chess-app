import { test } from "vitest";
import { givenASourceExplorer, thenTheRepliesCameFrom, whenTheSourceIs, whenYouAskForReplies } from "./source.steps.ts";

const FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

test.each(["lichess", "chessCom"] as const)("The source %s gives the replies of its explorer", async (source) => {
  const explorer = givenASourceExplorer(source);
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesCameFrom(explorer, source, FEN, 1450);
});

test("A new source is used from the next request", async () => {
  const explorer = givenASourceExplorer("lichess");
  await whenYouAskForReplies(explorer, FEN, 1450);
  whenTheSourceIs(explorer, "chessCom");
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesCameFrom(explorer, "chessCom", FEN, 1450);
});
