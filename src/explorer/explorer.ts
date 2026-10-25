import type { Reply } from "../line/messages.ts";

const BANDS = [0, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2500];
const ADDRESS = "https://explorer.lichess.ovh/lichess";

type Move = { uci: string; san: string; white: number; draws: number; black: number };

export function ratingBand(rating: number): number {
  return BANDS.findLast((band) => band <= rating) ?? 0;
}

export class LichessExplorer {
  readonly #token: () => string;
  readonly #fetchAnswer: typeof fetch;

  constructor(token: () => string, fetchAnswer: typeof fetch = (input, init) => fetch(input, init)) {
    this.#token = token;
    this.#fetchAnswer = fetchAnswer;
  }

  async replies(fen: string, rating: number): Promise<Reply[]> {
    const token = this.#token();
    if (token === "") {
      throw new Error("Save your Lichess token first. Click Change token.");
    }
    const query = new URLSearchParams({
      variant: "standard",
      speeds: "blitz,rapid,classical",
      ratings: String(ratingBand(rating)),
      fen,
      moves: "5",
      topGames: "0",
      recentGames: "0",
    });
    let answer: Response;
    try {
      answer = await this.#fetchAnswer(`${ADDRESS}?${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      throw new Error("Lichess did not answer (network error).");
    }
    if (answer.status === 401) {
      throw new Error("Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token, then click Change token.");
    }
    if (answer.status === 429) {
      throw new Error("Lichess got too many requests. Wait one minute, then start a new line.");
    }
    if (!answer.ok) {
      throw new Error(`Lichess did not answer (status ${answer.status}).`);
    }
    const position = (await answer.json()) as { white: number; draws: number; black: number; moves: Move[] };
    const total = position.white + position.draws + position.black;
    return position.moves.map(({ uci, san, white, draws, black }) => {
      const games = white + draws + black;
      return { uci: standardUci(uci, san), san, games, percent: Math.round((games * 100) / total) };
    });
  }
}

// The explorer gives castling as king to rook (e8h8). Standard UCI has king to target square (e8g8).
function standardUci(uci: string, san: string): string {
  if (!san.startsWith("O-O")) return uci;
  const file = san.startsWith("O-O-O") ? "c" : "g";
  return uci.slice(0, 2) + file + uci[3];
}
