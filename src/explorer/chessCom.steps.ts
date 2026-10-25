import { Chess } from "chess.js";
import { expect } from "vitest";
import type { Reply } from "../line/messages.ts";
import { ChessComExplorer } from "./chessCom.ts";

export const ME = "MyName";
const ARCHIVES = `https://api.chess.com/pub/player/${ME.toLowerCase()}/games/archives`;
const TODAY = new Date(2026, 1, 15);

type Game = { pgn: string; rules: string; time_class: string; white: { username: string; rating: number }; black: { username: string; rating: number } };
type Answer = { status: number; body?: unknown } | "networkError";
type TestExplorer = {
  explorer: ChessComExplorer;
  answers: Map<string, Answer>;
  requests: string[];
  username: { value: string };
  replies?: Reply[];
  error?: unknown;
};

export function monthUrl(year: number, month: number, username = ME.toLowerCase()): string {
  return `https://api.chess.com/pub/player/${username}/games/${year}/${String(month).padStart(2, "0")}`;
}

// A PGN as chess.com gives it: headers, clock comments and the result.
export function pgnOf(moves: string): string {
  const chess = new Chess();
  const tokens = moves.split(" ").map((san, index) => {
    chess.move(san);
    const clock = `{[%clk 0:02:59.${index}]}`;
    return index % 2 === 0 ? `${index / 2 + 1}. ${san} ${clock}` : `${Math.floor(index / 2) + 1}... ${san} ${clock}`;
  });
  return `[Event "Live Chess"]\n[Site "Chess.com"]\n[Result "*"]\n\n${tokens.join(" ")} *\n`;
}

type GameOptions = { you?: "white" | "black"; opponent?: number; timeClass?: string; rules?: string; name?: string; pgn?: string };

export function game(moves: string, options: GameOptions = {}): Game {
  const { you = "black", opponent = 1450, timeClass = "blitz", rules = "chess", name = ME, pgn = pgnOf(moves) } = options;
  const me = { username: name, rating: 1500 };
  const them = { username: "Opponent", rating: opponent };
  return { pgn, rules, time_class: timeClass, white: you === "white" ? me : them, black: you === "white" ? them : me };
}

export function givenAnExplorerWithTheMonths(months: Record<string, Game[] | Answer>, archives?: string[]): TestExplorer {
  const answers = new Map<string, Answer>();
  answers.set(ARCHIVES, { status: 200, body: { archives: archives ?? Object.keys(months) } });
  for (const [url, value] of Object.entries(months)) {
    answers.set(url, Array.isArray(value) ? { status: 200, body: { games: value } } : value);
  }
  return explorerOf(answers);
}

export function givenAnExplorerWithTheGames(games: Game[]): TestExplorer {
  return givenAnExplorerWithTheMonths({ [monthUrl(2026, 2)]: games });
}

export function givenAnExplorerThatAnswersTheArchives(answer: Answer): TestExplorer {
  return explorerOf(new Map([[ARCHIVES, answer]]));
}

function explorerOf(answers: Map<string, Answer>): TestExplorer {
  const requests: string[] = [];
  const username = { value: ME };
  let busy = false;
  const fetchAnswer: typeof fetch = async (input) => {
    const url = String(input);
    if (busy) throw new Error("Two requests at the same time.");
    busy = true;
    requests.push(url);
    await new Promise((resolve) => setTimeout(resolve, 1));
    busy = false;
    const answer = answers.get(url) ?? { status: 404, body: {} };
    if (answer === "networkError") throw new TypeError("Failed to fetch");
    return new Response(JSON.stringify(answer.body ?? {}), { status: answer.status });
  };
  return { explorer: new ChessComExplorer(() => username.value, fetchAnswer, () => TODAY), answers, requests, username };
}

export function whenTheUsernameIs(test: TestExplorer, username: string) {
  test.username.value = username;
}

export function whenTheArchivesAnswer(test: TestExplorer, answer: Answer) {
  test.answers.set(ARCHIVES, answer);
}

export function fenAfter(moves: string): string {
  const chess = new Chess();
  for (const san of moves.split(" ").filter((san) => san !== "")) chess.move(san);
  return chess.fen();
}

export async function whenYouAskForReplies(test: TestExplorer, fen: string, rating = 1450) {
  test.replies = undefined;
  test.error = undefined;
  try {
    test.replies = await test.explorer.replies(fen, rating);
  } catch (error) {
    test.error = error;
  }
}

export function thenTheRepliesAre(test: TestExplorer, replies: Reply[]) {
  expect(test.error).toBeUndefined();
  expect(test.replies).toEqual(replies);
}

export function thenTheReplyMovesAre(test: TestExplorer, sans: string[]) {
  expect(test.error).toBeUndefined();
  expect(test.replies!.map((reply) => reply.san)).toEqual(sans);
}

export function thenTheRequestsWere(test: TestExplorer, urls: string[]) {
  expect(test.requests).toEqual(urls);
}

export function thenTheErrorIs(test: TestExplorer, message: string) {
  expect(test.error).toEqual(new Error(message));
}

export { ARCHIVES };
