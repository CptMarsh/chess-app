import { expect, vi } from "vitest";
import type { Reply } from "../line/messages.ts";
import { LichessExplorer, ratingBand } from "./explorer.ts";

type Request = { url: URL; init?: RequestInit };
type TestExplorer = { explorer: LichessExplorer; requests: Request[]; replies?: Reply[]; error?: unknown };

export function thenTheRatingIsInTheBand(rating: number, band: number) {
  expect(ratingBand(rating)).toBe(band);
}

export function givenAnExplorerThatAnswers(status: number, body: unknown): TestExplorer {
  const requests: Request[] = [];
  const fetchAnswer: typeof fetch = async (input, init) => {
    requests.push({ url: new URL(String(input)), init });
    return new Response(JSON.stringify(body), { status });
  };
  return { explorer: new LichessExplorer("test-token", fetchAnswer), requests };
}

export function givenAnExplorerOnABrokenNetwork(): TestExplorer {
  const fetchAnswer: typeof fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  return { explorer: new LichessExplorer("test-token", fetchAnswer), requests: [] };
}

export function givenAnExplorerWithoutAToken(): TestExplorer {
  const requests: Request[] = [];
  const fetchAnswer: typeof fetch = async (input, init) => {
    requests.push({ url: new URL(String(input)), init });
    return new Response(JSON.stringify({ moves: [] }));
  };
  return { explorer: new LichessExplorer("", fetchAnswer), requests };
}

export function givenAnExplorerThatUsesTheGlobalFetch(): TestExplorer {
  vi.stubGlobal("fetch", function (this: unknown) {
    if (this !== undefined && this !== globalThis) throw new TypeError("Illegal invocation");
    return Promise.resolve(new Response(JSON.stringify({ moves: [] })));
  });
  return { explorer: new LichessExplorer("test-token"), requests: [] };
}

export async function whenYouAskForReplies(test: TestExplorer, fen: string, rating: number) {
  try {
    test.replies = await test.explorer.replies(fen, rating);
  } catch (error) {
    test.error = error;
  }
}

export function thenTheRequestWas(test: TestExplorer, address: string, query: Record<string, string>) {
  const { url } = test.requests[0];
  expect(url.origin + url.pathname).toBe(address);
  expect(Object.fromEntries(url.searchParams)).toEqual(query);
}

export function thenTheRepliesAre(test: TestExplorer, replies: Reply[]) {
  expect(test.error).toBeUndefined();
  expect(test.replies).toEqual(replies);
}

export function thenTheErrorIs(test: TestExplorer, message: string) {
  expect(test.error).toEqual(new Error(message));
}

export function thenNoRequestWasSent(test: TestExplorer) {
  expect(test.requests).toEqual([]);
}

export function thenTheRequestHadTheHeader(test: TestExplorer, name: string, value: string) {
  expect(new Headers(test.requests[0].init?.headers).get(name)).toBe(value);
}
