import { Chess } from "chess.js";
import type { Reply } from "../line/messages.ts";

const ADDRESS = "https://api.chess.com/pub/player";
const MONTHS = 12;
const HALF_MOVES = 40;
const MARGIN = 150;
const TIME_CLASSES = ["blitz", "rapid", "daily"];

type Side = { username: string; rating: number };
type ArchiveGame = { pgn: string; rules: string; time_class: string; white: Side; black: Side };
type Move = { uci: string; san: string };
// One of your games: your color, the rating of your opponent, and the first move of your opponent at each position.
type Game = { color: "w" | "b"; opponent: number; moves: Map<string, Move> };

export class ChessComExplorer {
  readonly #username: () => string;
  readonly #fetchAnswer: typeof fetch;
  readonly #today: () => Date;
  #games: { username: string; games: Game[] } | null = null;

  constructor(username: () => string, fetchAnswer: typeof fetch = (input, init) => fetch(input, init), today: () => Date = () => new Date()) {
    this.#username = username;
    this.#fetchAnswer = fetchAnswer;
    this.#today = today;
  }

  async replies(fen: string, rating: number): Promise<Reply[]> {
    const games = await this.#gamesOf(this.#username().trim());
    const key = keyOf(fen);
    const opponent = fen.split(" ")[1];
    const counts = new Map<string, Reply>();
    let total = 0;
    for (const game of games) {
      if (game.color === opponent || Math.abs(game.opponent - rating) > MARGIN) continue;
      const move = game.moves.get(key);
      if (move === undefined) continue;
      const reply = counts.get(move.uci) ?? { ...move, games: 0, percent: 0 };
      reply.games += 1;
      counts.set(move.uci, reply);
      total += 1;
    }
    return [...counts.values()]
      .sort((a, b) => b.games - a.games || (a.san < b.san ? -1 : a.san > b.san ? 1 : 0))
      .slice(0, 5)
      .map((reply) => ({ ...reply, percent: Math.round((reply.games * 100) / total) }));
  }

  async #gamesOf(username: string): Promise<Game[]> {
    if (username === "") throw new Error("Type your chess.com username in the settings.");
    const name = username.toLowerCase();
    if (this.#games?.username === name) return this.#games.games;
    const archives = await this.#get(`${ADDRESS}/${name}/games/archives`);
    if (archives === null) throw new Error(`chess.com has no player ${username}.`);
    const games: Game[] = [];
    for (const url of this.#recent((archives as { archives: string[] }).archives)) {
      const month = (await this.#get(url)) as { games: ArchiveGame[] } | null;
      for (const game of month?.games ?? []) {
        const yours = gameOf(game, name);
        if (yours !== null) games.push(yours);
      }
    }
    this.#games = { username: name, games };
    return games;
  }

  // The archives of the current month and the 11 months before it, from the oldest.
  #recent(archives: string[]): string[] {
    const today = this.#today();
    const now = today.getFullYear() * 12 + today.getMonth();
    return archives
      .map((url) => {
        const [year, month] = url.split("/").slice(-2).map(Number);
        return { url, index: year * 12 + month - 1 };
      })
      .filter(({ index }) => index <= now && index > now - MONTHS)
      .sort((a, b) => a.index - b.index)
      .map(({ url }) => url);
  }

  // The JSON of the answer, or null for 404. chess.com asks for one request at a time.
  async #get(url: string): Promise<unknown> {
    let answer: Response;
    try {
      answer = await this.#fetchAnswer(url);
    } catch {
      throw new Error("chess.com did not answer (network error).");
    }
    if (answer.status === 404) return null;
    if (answer.status === 429) {
      throw new Error("chess.com got too many requests. Wait one minute, then start a new line.");
    }
    if (!answer.ok) {
      throw new Error(`chess.com did not answer (status ${answer.status}).`);
    }
    return answer.json();
  }
}

function gameOf(game: ArchiveGame, name: string): Game | null {
  if (game.rules !== "chess" || !TIME_CLASSES.includes(game.time_class)) return null;
  const color = game.white.username.toLowerCase() === name ? "w" : game.black.username.toLowerCase() === name ? "b" : null;
  if (color === null) return null;
  const opponent = color === "w" ? game.black.rating : game.white.rating;
  const chess = new Chess();
  const moves = new Map<string, Move>();
  for (const san of sansOf(game.pgn).slice(0, HALF_MOVES)) {
    const key = keyOf(chess.fen());
    const side = chess.turn();
    let move;
    try {
      move = chess.move(san);
    } catch {
      break;
    }
    if (side !== color && !moves.has(key)) moves.set(key, { uci: move.lan, san: move.san });
  }
  return { color, opponent, moves };
}

// The moves of a PGN, without the headers, comments, variations, move numbers, NAGs and the result.
function sansOf(pgn: string): string[] {
  let text = pgn.replace(/^\[.*\]$/gm, "").replace(/\{[^}]*\}/g, " ").replace(/;.*$/gm, " ");
  while (/\([^()]*\)/.test(text)) text = text.replace(/\([^()]*\)/g, " ");
  return text
    .split(/\s+/)
    .map((token) => token.replace(/^\d+\.+/, "").replace(/[!?]+$/, ""))
    .filter((token) => token !== "" && !token.startsWith("$") && !["1-0", "0-1", "1/2-1/2", "*"].includes(token));
}

// The pieces, the side to move, the castling and the en passant square. The move counters do not matter.
function keyOf(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}
