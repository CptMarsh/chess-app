import { test } from "vitest";
import {
  ARCHIVES, fenAfter, game, givenAnExplorerThatAnswersTheArchives, givenAnExplorerWithTheGames, givenAnExplorerWithTheMonths, monthUrl,
  thenTheErrorIs, thenTheRepliesAre, thenTheReplyMovesAre, thenTheRequestsWere, whenTheArchivesAnswer, whenTheUsernameIs, whenYouAskForReplies,
} from "./chessCom.steps.ts";

const AFTER_E4 = fenAfter("e4");

test("The explorer asks for the archives, then for each month of the last 12 months, from the oldest", async () => {
  const months = [monthUrl(2025, 2), monthUrl(2025, 3), monthUrl(2025, 12), monthUrl(2026, 1), monthUrl(2026, 2)];
  const explorer = givenAnExplorerWithTheMonths(Object.fromEntries(months.map((url) => [url, []])), [...months].reverse());
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheRequestsWere(explorer, [ARCHIVES, monthUrl(2025, 3), monthUrl(2025, 12), monthUrl(2026, 1), monthUrl(2026, 2)]);
});

test("The username is in lower case in the addresses", async () => {
  const explorer = givenAnExplorerThatAnswersTheArchives({ status: 200, body: { archives: [] } });
  whenTheUsernameIs(explorer, "  Some.Name ");
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheRequestsWere(explorer, ["https://api.chess.com/pub/player/some.name/games/archives"]);
});

test("Each reply gets its games and its % of the games in the position", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e5", { you: "white" }), game("e4 e5", { you: "white" }), game("e4 c5", { you: "white" }), game("e4 e6 d4", { you: "white" })]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheRepliesAre(explorer, [
    { uci: "e7e5", san: "e5", games: 2, percent: 50 },
    { uci: "c7c5", san: "c5", games: 1, percent: 25 },
    { uci: "e7e6", san: "e6", games: 1, percent: 25 },
  ]);
});

test("With White to move, the replies come from your Black games", async () => {
  const explorer = givenAnExplorerWithTheGames([game("d4", { you: "black" }), game("e4", { you: "black" }), game("c4", { you: "white" })]);
  await whenYouAskForReplies(explorer, fenAfter(""));
  thenTheReplyMovesAre(explorer, ["d4", "e4"]);
});

test("With Black to move, the replies come from your White games", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e5", { you: "white" }), game("e4 c5", { you: "black" })]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheReplyMovesAre(explorer, ["e5"]);
});

test("Your color comes from your username in any case", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e5", { you: "white", name: "MYNAME" })]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheReplyMovesAre(explorer, ["e5"]);
});

test("Only games against opponents from rating - 150 to rating + 150 count", async () => {
  const explorer = givenAnExplorerWithTheGames([
    game("e4 e5", { you: "white", opponent: 1349 }),
    game("e4 c5", { you: "white", opponent: 1350 }),
    game("e4 e6", { you: "white", opponent: 1650 }),
    game("e4 d5", { you: "white", opponent: 1651 }),
  ]);
  await whenYouAskForReplies(explorer, AFTER_E4, 1500);
  thenTheReplyMovesAre(explorer, ["c5", "e6"]);
});

test("Only chess games of blitz, rapid and daily count", async () => {
  const explorer = givenAnExplorerWithTheGames([
    game("e4 e5", { you: "white", timeClass: "blitz" }),
    game("e4 c5", { you: "white", timeClass: "rapid" }),
    game("e4 e6", { you: "white", timeClass: "daily" }),
    game("e4 d5", { you: "white", timeClass: "bullet" }),
    game("e4 c6", { you: "white", rules: "chess960" }),
  ]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheReplyMovesAre(explorer, ["c5", "e5", "e6"]);
});

test("A transposition counts", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e6 d4 d5", { you: "white" }), game("d4 e6 e4 c5", { you: "white" })]);
  await whenYouAskForReplies(explorer, fenAfter("e4 e6 d4"));
  thenTheReplyMovesAre(explorer, ["c5", "d5"]);
});

test("A position two times in one game counts one time", async () => {
  const explorer = givenAnExplorerWithTheGames([game("Nf3 Nf6 Ng1 Ng8 Nf3 Nc6", { you: "black" })]);
  await whenYouAskForReplies(explorer, fenAfter(""));
  thenTheRepliesAre(explorer, [{ uci: "g1f3", san: "Nf3", games: 1, percent: 100 }]);
});

test("The replies are the 5 moves with the most games, then in the code-point order of the SAN", async () => {
  const explorer = givenAnExplorerWithTheGames(
    ["e5", "e5", "c5", "c5", "e6", "d5", "c6", "Nf6", "g6"].map((reply) => game(`e4 ${reply}`, { you: "white" })),
  );
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheReplyMovesAre(explorer, ["c5", "e5", "Nf6", "c6", "d5"]);
});

test("Castling comes as standard UCI", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e5 Nf3 Nc6 Bc4 Bc5 O-O", { you: "black" })]);
  await whenYouAskForReplies(explorer, fenAfter("e4 e5 Nf3 Nc6 Bc4 Bc5"));
  thenTheRepliesAre(explorer, [{ uci: "e1g1", san: "O-O", games: 1, percent: 100 }]);
});

test("Only the first 40 half-moves count", async () => {
  const shuffle = "Nf3 Nf6 Ng1 Ng8 ".repeat(9);
  const explorer = givenAnExplorerWithTheGames([game(`${shuffle}e4 e5 Nf3 Nc6 Bb5`), game("e4 e5 Nf3 Nc6 Bc4")]);
  await whenYouAskForReplies(explorer, fenAfter("e4 e5"));
  thenTheRepliesAre(explorer, [{ uci: "g1f3", san: "Nf3", games: 2, percent: 100 }]);
  await whenYouAskForReplies(explorer, fenAfter("e4 e5 Nf3 Nc6"));
  thenTheReplyMovesAre(explorer, ["Bc4"]);
});

test("A PGN with a wrong move keeps the moves before it", async () => {
  const explorer = givenAnExplorerWithTheGames([game("", { you: "white", pgn: "1. e4 {[%clk 0:03:00]} 1... e5 2. Ke3 Nc6 *" })]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheReplyMovesAre(explorer, ["e5"]);
});

test("No game in the position gives no replies", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e5", { you: "white" })]);
  await whenYouAskForReplies(explorer, fenAfter("d4"));
  thenTheRepliesAre(explorer, []);
});

test("The games are downloaded one time for a username", async () => {
  const explorer = givenAnExplorerWithTheGames([game("e4 e5", { you: "white" })]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  await whenYouAskForReplies(explorer, fenAfter("e4 e5"));
  thenTheRequestsWere(explorer, [ARCHIVES, monthUrl(2026, 2)]);
});

test("A new username downloads its games", async () => {
  const explorer = givenAnExplorerWithTheGames([]);
  await whenYouAskForReplies(explorer, AFTER_E4);
  whenTheUsernameIs(explorer, "Other");
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheRequestsWere(explorer, [ARCHIVES, monthUrl(2026, 2), "https://api.chess.com/pub/player/other/games/archives"]);
});

test("A failed download is not kept", async () => {
  const explorer = givenAnExplorerThatAnswersTheArchives({ status: 503 });
  await whenYouAskForReplies(explorer, AFTER_E4);
  whenTheArchivesAnswer(explorer, { status: 200, body: { archives: [] } });
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheRepliesAre(explorer, []);
  thenTheRequestsWere(explorer, [ARCHIVES, ARCHIVES]);
});

test("A month that gives 404 has no games", async () => {
  const explorer = givenAnExplorerWithTheMonths({ [monthUrl(2026, 1)]: { status: 404 }, [monthUrl(2026, 2)]: [game("e4 e5", { you: "white" })] });
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheReplyMovesAre(explorer, ["e5"]);
});

test("An empty username gives an error and sends no request", async () => {
  const explorer = givenAnExplorerWithTheGames([]);
  whenTheUsernameIs(explorer, "  ");
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheErrorIs(explorer, "Type your chess.com username in the settings.");
  thenTheRequestsWere(explorer, []);
});

test("An unknown player gives an error", async () => {
  const explorer = givenAnExplorerThatAnswersTheArchives({ status: 404 });
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheErrorIs(explorer, "chess.com has no player MyName.");
});

test.each([
  [429, "chess.com got too many requests. Wait one minute, then start a new line."],
  [503, "chess.com did not answer (status 503)."],
])("The status %i gives an error", async (status, message) => {
  const explorer = givenAnExplorerWithTheMonths({ [monthUrl(2026, 2)]: { status } });
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheErrorIs(explorer, message);
});

test("A network error gives an error", async () => {
  const explorer = givenAnExplorerThatAnswersTheArchives("networkError");
  await whenYouAskForReplies(explorer, AFTER_E4);
  thenTheErrorIs(explorer, "chess.com did not answer (network error).");
});
