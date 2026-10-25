import { afterEach, test, vi } from "vitest";
import {
  givenAnExplorerOnABrokenNetwork,
  givenAnExplorerThatAnswers,
  givenAnExplorerThatUsesTheGlobalFetch,
  givenAnExplorerWithAChangingToken,
  givenAnExplorerWithoutAToken,
  thenNoRequestWasSent,
  thenTheErrorIs,
  thenTheRatingIsInTheBand,
  thenTheRepliesAre,
  thenTheRequestHadTheHeader,
  thenTheRequestWas,
  whenYouAskForReplies,
} from "./explorer.steps.ts";

const FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

afterEach(() => {
  vi.unstubAllGlobals();
});

test.each([[1450, 1400], [800, 0], [2600, 2500], [1000, 1000]])("The rating %i is in the band %i", (rating, band) => {
  thenTheRatingIsInTheBand(rating, band);
});

test("The request asks Lichess for the 5 most common moves of your band", async () => {
  const explorer = givenAnExplorerThatAnswers(200, { moves: [] });
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRequestWas(explorer, "https://explorer.lichess.ovh/lichess", {
    variant: "standard", speeds: "blitz,rapid,classical", ratings: "1400",
    fen: FEN, moves: "5", topGames: "0", recentGames: "0",
  });
  thenTheRequestHadTheHeader(explorer, "Authorization", "Bearer test-token");
});

test("Each reply gets the total of its games", async () => {
  const explorer = givenAnExplorerThatAnswers(200, { white: 100, draws: 20, black: 80, moves: [
    { uci: "e7e5", san: "e5", white: 10, draws: 5, black: 15 },
    { uci: "c7c5", san: "c5", white: 3, draws: 1, black: 2 },
  ] });
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesAre(explorer, [{ uci: "e7e5", san: "e5", games: 30, percent: 15 }, { uci: "c7c5", san: "c5", games: 6, percent: 3 }]);
});

test("Each reply gets its % of all games in the position", async () => {
  const explorer = givenAnExplorerThatAnswers(200, { white: 100, draws: 20, black: 80, moves: [
    { uci: "e7e5", san: "e5", white: 40, draws: 4, black: 40 },
    { uci: "c7c5", san: "c5", white: 1, draws: 1, black: 1 },
  ] });
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesAre(explorer, [{ uci: "e7e5", san: "e5", games: 84, percent: 42 }, { uci: "c7c5", san: "c5", games: 3, percent: 2 }]);
});

test("A castling reply comes as standard UCI", async () => {
  const explorer = givenAnExplorerThatAnswers(200, { white: 30, draws: 0, black: 0, moves: [
    { uci: "e8h8", san: "O-O", white: 1, draws: 1, black: 1 },
    { uci: "e8a8", san: "O-O-O", white: 1, draws: 1, black: 1 },
    { uci: "e1h1", san: "O-O+", white: 1, draws: 1, black: 1 },
    { uci: "e1a1", san: "O-O-O#", white: 1, draws: 1, black: 1 },
    { uci: "e8h8", san: "Rh8", white: 1, draws: 1, black: 1 },
  ] });
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesAre(explorer, [
    { uci: "e8g8", san: "O-O", games: 3, percent: 10 },
    { uci: "e8c8", san: "O-O-O", games: 3, percent: 10 },
    { uci: "e1g1", san: "O-O+", games: 3, percent: 10 },
    { uci: "e1c1", san: "O-O-O#", games: 3, percent: 10 },
    { uci: "e8h8", san: "Rh8", games: 3, percent: 10 },
  ]);
});

test.each([
  [401, "Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token, then click Change token."],
  [429, "Lichess got too many requests. Wait one minute, then start a new line."],
  [503, "Lichess did not answer (status 503)."],
])("The status %i gives an error", async (status, message) => {
  const explorer = givenAnExplorerThatAnswers(status, {});
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheErrorIs(explorer, message);
});

test("A network failure gives an error", async () => {
  const explorer = givenAnExplorerOnABrokenNetwork();
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheErrorIs(explorer, "Lichess did not answer (network error).");
});

test("An empty token gives an error and sends no request", async () => {
  const explorer = givenAnExplorerWithoutAToken();
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheErrorIs(explorer, "Save your Lichess token first. Click Change token.");
  thenNoRequestWasSent(explorer);
});

test("Each request uses the token of that moment", async () => {
  const explorer = givenAnExplorerWithAChangingToken();
  await whenYouAskForReplies(explorer, FEN, 1450);
  explorer.token.value = "second-token";
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRequestHadTheHeader(explorer, "Authorization", "Bearer second-token");
});

test("The global fetch is called without a different this", async () => {
  const explorer = givenAnExplorerThatUsesTheGlobalFetch();
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesAre(explorer, []);
});
