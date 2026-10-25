import { expect } from "vitest";
import type { Reply } from "../line/messages.ts";
import type { Source } from "../settings/settings.ts";
import { SourceExplorer } from "./source.ts";

type Call = { source: Source; fen: string; rating: number };
type TestExplorer = { explorer: SourceExplorer; source: { value: Source }; calls: Call[]; replies?: Reply[] };

function fakeExplorer(source: Source, calls: Call[]) {
  return {
    replies: async (fen: string, rating: number): Promise<Reply[]> => {
      calls.push({ source, fen, rating });
      return [{ uci: "e7e5", san: "e5", games: 1, percent: source === "lichess" ? 1 : 2 }];
    },
  };
}

export function givenASourceExplorer(start: Source): TestExplorer {
  const calls: Call[] = [];
  const source = { value: start };
  const explorer = new SourceExplorer(() => source.value, fakeExplorer("lichess", calls), fakeExplorer("chessCom", calls));
  return { explorer, source, calls };
}

export function whenTheSourceIs(test: TestExplorer, source: Source) {
  test.source.value = source;
}

export async function whenYouAskForReplies(test: TestExplorer, fen: string, rating: number) {
  test.replies = await test.explorer.replies(fen, rating);
}

export function thenTheRepliesCameFrom(test: TestExplorer, source: Source, fen: string, rating: number) {
  expect(test.calls.at(-1)).toEqual({ source, fen, rating });
  expect(test.replies).toEqual([{ uci: "e7e5", san: "e5", games: 1, percent: source === "lichess" ? 1 : 2 }]);
}
