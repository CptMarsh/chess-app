# Opening Trainer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A browser page where you play 5 White moves, the app replies with common moves of your Lichess rating band, and Stockfish checks your moves 2 to 5.

**Architecture:** The rules of one line are in synchronous handlers on the existing command-query bus (`src/line/`). One async unit, the trainer, waits for the Lichess explorer and the Stockfish worker, then sends a command that contains the result. The UI asks the query `CurrentLine` after each command and draws the board with `chessground`.

**Tech Stack:** TypeScript 7, Vite 8, Vitest 5, Cucumber 13 with Playwright 1.64, `chess.js` 1.4.0, `chessground` 9.2.1, `stockfish` 19.0.1.

**Spec:** `Docs/superpowers/specs/2026-10-23-opening-trainer-design.md`. Read it before each task. Message texts, limits and URLs come from it.

## Global Constraints

- Node 24.13.1. `tsconfig.json` has `erasableSyntaxOnly`: no parameter properties, no enums. Put dependencies in `#private` fields that the constructor sets, as in `src/bus/bus.ts`.
- Imports use the `.ts` extension.
- Install dependencies with `npm install --save-exact`: `chess.js@1.4.0`, `stockfish@19.0.1`, `chessground@9.2.1`. No other new dependencies.
- Messages are classes. Each handler is a class that implements `CommandHandler<C>` or `QueryHandler<Q>` from `src/bus/bus.ts`. Handlers are synchronous and never call `send`. Use the names "command" and "query", not "write" and "read".
- Only `src/trainer/` uses `await`. Only `src/line/` holds rules.
- Each `X.spec.ts` has `test("…")` cases that call only `given…`, `when…` and `then…` functions from `X.steps.ts`, as in `src/bus/`. Write each case red, then green, then refactor, one case at a time.
- A task is complete when `npm test` and `npm run typecheck` pass.
- Message texts are exactly as in the spec, including the final period.
- Documentation pages use OKF front matter (`type: component`, `title`, `description`, `resource`, `tags`), as in `Docs/command-query-bus.md`. Write them in ASD-STE100 Simplified Technical English. `Docs/index.md` links to each page under "Concepts".
- Commit messages start with `opening-trainer: ` and end with the attribution lines that the session gives.
- Do not build anything from the spec's "Not included" section.

## Review Focus

1. **Unbound `fetch`.** If the explorer keeps the global `fetch` in a field and calls it as `this.#fetch(…)`, the browser throws "Illegal invocation" and each line stops with the network message. Pinned in Task 4.
2. **Empty rating field.** `Number("")` is `0`, so an empty field would start a line in band 0 without an error. It must give the rating error. Pinned in Task 7.
3. **Castling and promotion as UCI.** The board sends `e1g1` and `b7a8q`, and Stockfish answers the same. The judgement must compare UCI from `chess.js` (`lan`), not SAN. Pinned in Task 3.
4. **UCI noise.** Stockfish sends `info string …` lines without a score, `score cp N upperbound` and `bestmove X ponder Y`. The engine must ignore the noise and keep the last score. Pinned in Task 5.
5. **The wrong position for the engine.** The engine must judge your move in the position before your move, not after it. Pinned in Task 6.

---

### Task 1: Line — start, your move and the current line

**Files:**
- Modify: `package.json` (add `chess.js` 1.4.0 to `dependencies`)
- Create: `src/line/messages.ts`, `src/line/lineState.ts`, `src/line/line.ts`
- Create: `src/line/commands/startLineHandler.ts`, `src/line/commands/playYourMoveHandler.ts`, `src/line/queries/currentLineHandler.ts`
- Test: `src/line/line.spec.ts`, `src/line/line.steps.ts`
- Create: `Docs/line.md`; Modify: `Docs/index.md`

**Interfaces:**
- Consumes: `Bus`, `Query`, `CommandHandler`, `QueryHandler` from `src/bus/bus.ts`.
- Produces (all later tasks use these):

```ts
// src/line/messages.ts
export type Status = "yourMove" | "checkingYourMove" | "waitingForReply" | "ended";
export type Arrow = { from: string; to: string };
export type Verdict = { bestMove: string; bestScore: number; yourScore: number };
export type Reply = { uci: string; san: string; games: number };
export type LineView = {
  fen: string; moves: string[]; status: Status; message: string;
  arrow: Arrow | null; legalMoves: Map<string, string[]>;
};
export class StartLine { readonly rating: number }        // constructor(rating)
export class PlayYourMove { readonly move: string }       // UCI, e.g. "e2e4"
export class JudgeYourMove { readonly verdict: Verdict }
export class PlayReply { readonly replies: Reply[] }
export class StopLine { readonly message: string }
export class CurrentLine extends Query<LineView> {}
export class LineBus extends Bus<StartLine | PlayYourMove | JudgeYourMove | PlayReply | StopLine, CurrentLine> {}

// src/line/lineState.ts — the one object that all handlers share
export class LineState {
  chess: Chess; status: Status /* "ended" before the first line */; message: string;
  arrow: Arrow | null; yourMoves: number;
  end(text: string): void; // status = "ended"; a text that is not empty goes after the current message, with one space between them
}

// src/line/line.ts
export function attachLine(bus: LineBus, random: () => number = Math.random): void;
```

- [ ] **Step 1: Write the failing tests**

```ts
// src/line/line.spec.ts
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

test("Before the first line, the board is locked", () => {
  const line = givenNoLine();
  thenTheLineIs(line, { fen: START, moves: [], status: "ended", message: "", arrow: null });
  thenThereAreNoLegalMoves(line);
});

test("A new line starts at the start position", () => {
  const line = givenANewLine(1450);
  thenTheLineIs(line, { fen: START, moves: [], status: "yourMove", message: "", arrow: null });
  thenTheLegalMovesFrom(line, "e2", ["e3", "e4"]);
});

test.each([-1, 1450.5, Number.NaN])("The rating %s is rejected", (rating) => {
  const line = givenNoLine();
  whenYouStartALine(line, rating);
  thenYouGetTheError(line, "The rating must be a whole number, 0 or more.");
  thenTheLineIs(line, { status: "ended" });
});

test("Your first move waits for the reply without a judgement", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  thenTheLineIs(line, { moves: ["e4"], status: "waitingForReply" });
  thenThereAreNoLegalMoves(line);
});
```

`src/line/line.steps.ts` has `type TestLine = { bus: LineBus; error?: unknown }` and these functions:
- `givenNoLine(random = 0): TestLine`: a new `LineBus` with `attachLine(bus, () => random)`.
- `givenANewLine(rating: number, random = 0): TestLine`: `givenNoLine(random)`, then sends `StartLine(rating)`.
- `whenYouStartALine(line, rating)`: sends `StartLine`, and keeps a thrown error in `line.error`.
- `whenYouPlay(line, move: string)`: sends `PlayYourMove`.
- `thenTheLineIs(line, expected: Partial<LineView>)`: `expect(bus.ask(new CurrentLine())).toMatchObject(expected)`.
- `thenTheLegalMovesFrom(line, square, targets)`, `thenThereAreNoLegalMoves(line)` (the map is empty), `thenYouGetTheError(line, message)` (`toEqual(new Error(message))`).

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/line/line.spec.ts`
Expected: FAIL, because `./messages.ts` does not exist.

- [ ] **Step 3: Install `chess.js` and implement the messages, `LineState`, `attachLine` and the 3 handlers**

Run `npm install --save-exact chess.js@1.4.0`.
- `StartLineHandler`: if `!Number.isInteger(rating) || rating < 0`, throw the rating error and do not change the state. Otherwise reset the state: a new `Chess`, status `yourMove`, empty message, no arrow, `yourMoves = 0`. The handler does not keep the rating.
- `PlayYourMoveHandler`: play the UCI move with `chess.move({ from, to, promotion })`, add 1 to `yourMoves`, clear the message and the arrow. The status is `waitingForReply` if `yourMoves` is 1, otherwise `checkingYourMove`.
- `CurrentLineHandler`: `moves` is `chess.history()`. `legalMoves` groups `chess.moves({ verbose: true })` by `from` only when the status is `yourMove`. Otherwise it is an empty `Map`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npx vitest run src/line/line.spec.ts`, then `npm test` and `npm run typecheck`.
Expected: PASS.

- [ ] **Step 5: Write `Docs/line.md` and link it from `Docs/index.md`**

The page has `resource: src/line/line.ts`. It gives the commands, the query, the status values and the rules from this task. Tasks 2 and 3 add to it.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/line Docs/line.md Docs/index.md
git commit -m "opening-trainer: start a line and play your move"
```

---

### Task 2: Line — the reply and the stop

**Files:**
- Create: `src/line/commands/playReplyHandler.ts`, `src/line/commands/stopLineHandler.ts`
- Modify: `src/line/line.ts`, `src/line/line.spec.ts`, `src/line/line.steps.ts`, `Docs/line.md`

**Interfaces:**
- Consumes: Task 1 (`PlayReply`, `StopLine`, `Reply`, `LineState.end`).
- Produces: `attachLine` attaches the handlers for `PlayReply` and `StopLine`.

- [ ] **Step 1: Write the failing tests**

```ts
const E5 = { uci: "e7e5", san: "e5", games: 30 };
const C5 = { uci: "c7c5", san: "c5", games: 10 };

test("The random number 0.74 picks the first of 30 and 10 games", () => {
  const line = givenANewLine(1450, 0.74);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheLineIs(line, { moves: ["e4", "e5"], status: "yourMove" });
});

test("The random number 0.76 picks the second of 30 and 10 games", () => {
  const line = givenANewLine(1450, 0.76);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, [E5, C5]);
  thenTheLineIs(line, { moves: ["e4", "c5"], status: "yourMove" });
});

test("No replies ends the line", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  whenTheReplyIsPickedFrom(line, []);
  thenTheLineIs(line, { status: "ended", message: "No games at your level after this position." });
});

test("StopLine ends the line with its message", () => {
  const line = givenANewLine(1450);
  whenYouPlay(line, "e2e4");
  whenTheLineStops(line, "Lichess did not answer (status 503).");
  thenTheLineIs(line, { status: "ended", message: "Lichess did not answer (status 503)." });
  thenThereAreNoLegalMoves(line);
});
```

New steps: `whenTheReplyIsPickedFrom(line, replies: Reply[])` sends `PlayReply`. `whenTheLineStops(line, message)` sends `StopLine`.

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/line/line.spec.ts`
Expected: the 4 new cases FAIL (no handler, so the line does not change).

- [ ] **Step 3: Implement the 2 handlers and attach them in `attachLine`**

- `PlayReplyHandler(state, random)`: if `replies` is empty, `state.end("No games at your level after this position.")`. Otherwise pick with the spec's algorithm (the first reply where the running total of `games` is more than `random() * total`), play its `uci`, and set the status to `yourMove`. Keep the message and the arrow. Your next move clears them.
- `StopLineHandler(state)`: `state.end(message)`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 5: Add the reply and the stop to `Docs/line.md`, then commit**

```bash
git add src/line Docs/line.md
git commit -m "opening-trainer: pick the reply by game count and stop a line"
```

---

### Task 3: Line — the judgement of your move

**Files:**
- Create: `src/line/commands/judgeYourMoveHandler.ts`
- Modify: `src/line/line.ts`, `src/line/line.spec.ts`, `src/line/line.steps.ts`, `Docs/line.md`

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: `attachLine` attaches the handler for `JudgeYourMove`.

- [ ] **Step 1: Write the failing tests**

```ts
const verdict = (bestMove: string, bestScore: number, yourScore: number) => ({ bestMove, bestScore, yourScore });

test("A later move waits for the judgement", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "g1f3");
  thenTheLineIs(line, { moves: ["e4", "e5", "Nf3"], status: "checkingYourMove" });
  thenThereAreNoLegalMoves(line);
});

test("The best move gets 'Best move.'", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "g1f3");
  whenTheEngineGives(line, verdict("g1f3", 30, 30));
  thenTheLineIs(line, { moves: ["e4", "e5", "Nf3"], status: "waitingForReply", message: "Best move.", arrow: null });
});

test("A move that loses 20 centipawns or less stays", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "b1c3");
  whenTheEngineGives(line, verdict("g1f3", 30, 10));
  thenTheLineIs(line, { moves: ["e4", "e5", "Nc3"], message: "Good. The best move was Nf3.", arrow: null });
});

test("A move that loses more than 20 centipawns is replaced", () => {
  const line = givenALineAfter(["e2e4", "e7e5"]);
  whenYouPlay(line, "f1a6");
  whenTheEngineGives(line, verdict("g1f3", 30, -250));
  thenTheLineIs(line, {
    moves: ["e4", "e5", "Nf3"], status: "waitingForReply",
    message: "Ba6 loses 2.8 pawns. The best move is Nf3.", arrow: { from: "g1", to: "f3" },
  });
});

test("A move that allows mate is replaced", () => {
  const line = givenALineAfter(["f2f3", "e7e5"]);
  whenYouPlay(line, "g2g4");
  whenTheEngineGives(line, verdict("e2e4", -50, -10000));
  thenTheLineIs(line, { moves: ["f3", "e5", "e4"], message: "g4 allows mate. The best move is e4." });
});

test("A move that misses a mate is replaced, and the mate ends the line", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6"]);
  whenYouPlay(line, "d2d3");
  whenTheEngineGives(line, verdict("h5f7", 10000, 300));
  thenTheLineIs(line, { status: "ended", message: "d3 misses a mate. The best move is Qxf7#. Checkmate." });
});

test("Castling is compared as e1g1", () => {
  const line = givenALineAfter(["e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6"]);
  whenYouPlay(line, "e1g1");
  whenTheEngineGives(line, verdict("e1g1", 30, 30));
  thenTheLineIs(line, { message: "Best move." });
});

test("The line ends after your fifth move, and a promotion is compared with its piece", () => {
  const line = givenALineAfter(["e2e4", "d7d5", "e4d5", "c7c6", "d5c6", "g8f6", "c6b7", "b8c6"]);
  whenYouPlay(line, "b7a8q");
  whenTheEngineGives(line, verdict("b7a8q", 900, 900));
  thenTheLineIs(line, { status: "ended", message: "Best move." });
});
```

New steps:
- `givenALineAfter(moves: string[]): TestLine`: `givenANewLine(1450)`. Then for each move: at an even index, send `PlayYourMove`, and from your second move, also send `JudgeYourMove` with the verdict `(move, 0, 0)`. At an odd index, send `PlayReply([{ uci: move, san: "", games: 1 }])`.
- `whenTheEngineGives(line, verdict: Verdict)`: sends `JudgeYourMove`.

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/line/line.spec.ts`
Expected: "A later move waits for the judgement" PASSES, because Task 1 built that. The other new cases FAIL.

- [ ] **Step 3: Implement `JudgeYourMoveHandler(state)` and attach it**

- Your move is the `lan` of the last entry of `chess.history({ verbose: true })`. Compare it with `bestMove`. Do not compare SAN.
- Use the message table in the spec. Get the SAN of the best move from the position before your move. The pawn value is `(loss / 100).toFixed(1)`.
- To replace your move: undo it, play `bestMove`, and set `arrow` to its `from` and `to`.
- Then, if `chess.isCheckmate()`: `state.end("Checkmate.")`. Otherwise, if `yourMoves` is 5: `state.end("")`. Otherwise the status is `waitingForReply`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 5: Add the judgement table to `Docs/line.md`, then commit**

```bash
git add src/line Docs/line.md
git commit -m "opening-trainer: judge your move against the engine"
```

---

### Task 4: Lichess explorer

**Files:**
- Modify: `.gitignore` (add `*.local`. The spec says that git ignores `.env.local`, but the current `.gitignore` does not.)
- Create: `src/explorer/explorer.ts`
- Test: `src/explorer/explorer.spec.ts`, `src/explorer/explorer.steps.ts`
- Create: `Docs/lichess-explorer.md`; Modify: `Docs/index.md`

**Interfaces:**
- Consumes: `Reply` from `src/line/messages.ts`.
- Produces:

```ts
export function ratingBand(rating: number): number;
export class LichessExplorer {
  constructor(token: string, fetchAnswer: typeof fetch = (input, init) => fetch(input, init));
  replies(fen: string, rating: number): Promise<Reply[]>;
}
```

- [ ] **Step 1: Write the failing tests**

```ts
const FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

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
  const explorer = givenAnExplorerThatAnswers(200, { moves: [
    { uci: "e7e5", san: "e5", white: 10, draws: 5, black: 15 },
    { uci: "c7c5", san: "c5", white: 3, draws: 1, black: 2 },
  ] });
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesAre(explorer, [{ uci: "e7e5", san: "e5", games: 30 }, { uci: "c7c5", san: "c5", games: 6 }]);
});

test.each([
  [401, "Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token."],
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
  thenTheErrorIs(explorer, "Add your Lichess token to .env.local as VITE_LICHESS_TOKEN, then start the app again.");
  thenNoRequestWasSent(explorer);
});

test("The global fetch is called without a different this", async () => {
  const explorer = givenAnExplorerThatUsesTheGlobalFetch();
  await whenYouAskForReplies(explorer, FEN, 1450);
  thenTheRepliesAre(explorer, []);
});
```

Steps: the fake `fetch` records the URL and the `init`, and gives `new Response(JSON.stringify(body), { status })`. The broken network fake rejects with `new TypeError("Failed to fetch")`. `givenAnExplorerThatUsesTheGlobalFetch` uses `vi.stubGlobal("fetch", function (this: unknown) { … })`, which throws `TypeError("Illegal invocation")` when `this` is not `undefined` or `globalThis`, and gives `{ moves: [] }` otherwise. It makes `new LichessExplorer("test-token")` with no second argument. Call `vi.unstubAllGlobals()` in `afterEach`. `thenTheRequestWas` compares the origin and path, and compares `Object.fromEntries(url.searchParams)` with `toEqual`.

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/explorer/explorer.spec.ts`
Expected: FAIL, because `./explorer.ts` does not exist.

- [ ] **Step 3: Implement `ratingBand` and `LichessExplorer`**

Build the query with `URLSearchParams`. Check the token before the request. `replies` throws `Error` with the spec's text for each case in the error table.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 5: Write `Docs/lichess-explorer.md` (with the token setup from the spec), link it from `Docs/index.md`, then commit**

```bash
git check-ignore .env.local   # Expected: .env.local
git add .gitignore src/explorer Docs/lichess-explorer.md Docs/index.md
git commit -m "opening-trainer: get the common replies from the Lichess explorer"
```

---

### Task 5: Stockfish engine

**Files:**
- Modify: `package.json` (add `stockfish` 19.0.1, and the script `"postinstall": "node scripts/copy-stockfish.js"`), `.gitignore` (add `public/stockfish`)
- Create: `scripts/copy-stockfish.js`, `src/engine/engine.ts`
- Test: `src/engine/engine.spec.ts`, `src/engine/engine.steps.ts`
- Create: `Docs/engine.md`; Modify: `Docs/index.md`

**Interfaces:**
- Consumes: `Verdict` from `src/line/messages.ts`.
- Produces:

```ts
export type EngineWorker = Pick<Worker, "postMessage" | "addEventListener">;
export class StockfishEngine {
  constructor(worker: EngineWorker); // sends "uci" at once
  judge(fen: string, move: string): Promise<Verdict>;
}
// The worker URL that main.ts uses: "/stockfish/stockfish-19-lite-single.js"
```

- [ ] **Step 1: Write the failing tests**

```ts
const FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const SEARCH = [
  "info string NNUE evaluation using nn-1c0000000000.nnue",
  "info depth 15 seldepth 18 score cp 20 pv e2e4",
  "info depth 16 seldepth 21 multipv 1 score cp 34 nodes 9000 pv e2e4 e7e5",
  "bestmove e2e4 ponder e7e5",
];

test("The best move needs one search", async () => {
  const engine = givenAnEngineThatAnswers({ search: SEARCH });
  await whenYouAskForAJudgement(engine, FEN, "e2e4");
  thenTheVerdictIs(engine, { bestMove: "e2e4", bestScore: 34, yourScore: 34 });
  thenTheCommandsWere(engine, ["uci", "ucinewgame", "isready", `position fen ${FEN}`, "go depth 16"]);
});

test("A different move gets a second search with searchmoves", async () => {
  const engine = givenAnEngineThatAnswers({
    search: SEARCH,
    searchmoves: ["info depth 16 score cp -40 upperbound pv a2a3", "bestmove a2a3"],
  });
  await whenYouAskForAJudgement(engine, FEN, "a2a3");
  thenTheVerdictIs(engine, { bestMove: "e2e4", bestScore: 34, yourScore: -40 });
  thenTheCommandsEndWith(engine, [`position fen ${FEN}`, "go depth 16 searchmoves a2a3"]);
});

test.each([["score mate 3", 10000], ["score mate -2", -10000]])("%s becomes %i", async (score, value) => {
  const engine = givenAnEngineThatAnswers({ search: [`info depth 16 ${score} pv e2e4`, "bestmove e2e4"] });
  await whenYouAskForAJudgement(engine, FEN, "e2e4");
  thenTheVerdictIs(engine, { bestMove: "e2e4", bestScore: value, yourScore: value });
});

test("A worker error gives the engine message", async () => {
  const engine = givenAnEngineWhoseWorkerFails();
  await whenYouAskForAJudgement(engine, FEN, "e2e4");
  thenTheErrorIs(engine, "The engine did not start. Reload the page.");
});
```

Steps: `class FakeWorker extends EventTarget` records each `postMessage` command. It answers each command in a microtask with one `MessageEvent("message", { data: line })` for each line: `uci` gives `uciok`, `isready` gives `readyok`, `go depth 16` gives `search`, and `go depth 16 searchmoves …` gives `searchmoves`. The failing fake dispatches `new Event("error")` at once. (A check with `tsc` showed that this fake fits `Pick<Worker, "postMessage" | "addEventListener">`.)

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/engine/engine.spec.ts`
Expected: FAIL, because `./engine.ts` does not exist.

- [ ] **Step 3: Implement `StockfishEngine`**

Follow the spec's engine section. Wait for `uciok` before the first `ucinewgame`. Keep the last `score` before `bestmove`. A line without ` score ` changes nothing. After a worker `error` event, the current `judge` and each later `judge` reject with the engine message.

- [ ] **Step 4: Install Stockfish and add the copy script**

Run `npm install --save-exact stockfish@19.0.1`. `scripts/copy-stockfish.js` copies `node_modules/stockfish/bin/stockfish-19-lite-single.js` and `.wasm` into `public/stockfish/` (`fs.mkdirSync` with `recursive`, then `fs.copyFileSync`). Add the `postinstall` script and the `.gitignore` line.

Run: `node scripts/copy-stockfish.js && ls public/stockfish`
Expected: `stockfish-19-lite-single.js  stockfish-19-lite-single.wasm`

- [ ] **Step 5: Run the tests and make sure they pass**

Run: `npm test` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 6: Write `Docs/engine.md`, link it from `Docs/index.md`, then commit**

```bash
git add package.json package-lock.json .gitignore scripts src/engine Docs/engine.md Docs/index.md
git commit -m "opening-trainer: judge a move with Stockfish in a worker"
```

---

### Task 6: Trainer

**Files:**
- Create: `src/trainer/trainer.ts`
- Test: `src/trainer/trainer.spec.ts`, `src/trainer/trainer.steps.ts`
- Create: `Docs/trainer.md`; Modify: `Docs/index.md`

**Interfaces:**
- Consumes: `LineBus`, the messages and `attachLine` (Tasks 1–3). `LichessExplorer` and `StockfishEngine` fit the 2 types below.
- Produces:

```ts
export type Engine = { judge(fen: string, move: string): Promise<Verdict> };
export type Explorer = { replies(fen: string, rating: number): Promise<Reply[]> };
export class Trainer {
  constructor(bus: LineBus, engine: Engine, explorer: Explorer, show: () => void);
  start(rating: number): void;              // sends StartLine, then show(); a StartLine error goes to the caller
  yourMove(move: string): Promise<void>;    // the 4 steps of the spec
}
```

- [ ] **Step 1: Write the failing tests**

```ts
test("Your first move goes to the explorer without a judgement", async () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  thenTheEngineWasNotAsked(trainer);
  thenTheExplorerWasAskedWith(trainer, fenAfter(["e2e4"]), 1450);
  thenTheLineIs(trainer, { moves: ["e4", "e5"], status: "yourMove" });
});

test("The engine judges your move in the position before it", async () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "g1f3");
  thenTheEngineWasAskedWith(trainer, fenAfter(["e2e4", "e7e5"]), "g1f3");
});

test("The status shows each wait", async () => {
  const trainer = givenATrainerThatHoldsItsAnswers();
  whenYouStart(trainer, 1450);
  whenYouStartToPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "e7e5", san: "e5", games: 1 }]);
  whenYouStartToPlay(trainer, "g1f3");
  thenTheLineIs(trainer, { status: "checkingYourMove" });
  await whenTheEngineAnswers(trainer, { bestMove: "g1f3", bestScore: 0, yourScore: 0 });
  thenTheLineIs(trainer, { status: "waitingForReply" });
  await whenTheExplorerAnswers(trainer, [{ uci: "b8c6", san: "Nc6", games: 1 }]);
  thenTheLineIs(trainer, { status: "yourMove" });
  thenTheViewWasShown(trainer, 6);
});

test("The explorer is not asked after your fifth move", async () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, 1450);
  for (const move of ["e2e4", "g1f3", "f1b5", "b5a4", "e1g1"]) await whenYouPlay(trainer, move);
  thenTheExplorerWasAskedTimes(trainer, 4);
  thenTheLineIs(trainer, { status: "ended" });
});

test("An engine error stops the line", async () => {
  const trainer = givenATrainerWithAFailingEngine("The engine did not start. Reload the page.");
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  await whenYouPlay(trainer, "g1f3");
  thenTheLineIs(trainer, { status: "ended", message: "The engine did not start. Reload the page." });
});

test("An explorer error stops the line", async () => {
  const trainer = givenATrainerWithAFailingExplorer("Lichess did not answer (status 503).");
  whenYouStart(trainer, 1450);
  await whenYouPlay(trainer, "e2e4");
  thenTheLineIs(trainer, { status: "ended", message: "Lichess did not answer (status 503)." });
});

test("A bad rating goes to the caller", () => {
  const trainer = givenATrainer();
  whenYouStart(trainer, -1);
  thenYouGetTheError(trainer, "The rating must be a whole number, 0 or more.");
});
```

Steps: the trainer uses a real `LineBus` with `attachLine(bus, () => 0)`. The default fake engine gives `{ bestMove: move, bestScore: 0, yourScore: 0 }`. The default fake explorer gives, in turn, `e7e5`, `b8c6`, `a7a6` and `g8f6`, each as `{ uci, san, games: 1 }`. Both fakes record their calls. The holding fakes give a promise that `whenTheEngineAnswers` or `whenTheExplorerAnswers` resolves. These steps then wait one macrotask (`await new Promise((r) => setTimeout(r))`). `whenYouStartToPlay` does not wait for `yourMove`. `whenYouStart` keeps a thrown error for `thenYouGetTheError`. `fenAfter(moves)` plays the UCI moves with `chess.js` and gives `fen()`. `show` counts its calls.

- [ ] **Step 2: Run the tests and make sure they fail**

Run: `npx vitest run src/trainer/trainer.spec.ts`
Expected: FAIL, because `./trainer.ts` does not exist.

- [ ] **Step 3: Implement `Trainer`**

`start` keeps the rating in a field for the explorer. `yourMove` calls `show()` after each `send`. Judge only if the status after `PlayYourMove` is `checkingYourMove`, and ask the explorer only if the status is not `ended`. The trainer reads the status from `CurrentLine`, and holds no rules of its own. On an error from the engine or the explorer, send `StopLine(error.message)` and call `show()`.

- [ ] **Step 4: Run the tests and make sure they pass**

Run: `npm test` and `npm run typecheck`. Expected: PASS.

- [ ] **Step 5: Write `Docs/trainer.md`, link it from `Docs/index.md`, then commit**

```bash
git add src/trainer Docs/trainer.md Docs/index.md
git commit -m "opening-trainer: run the async steps of a line"
```

---

### Task 7: The screen and the e2e scenarios

**Files:**
- Modify: `package.json` (add `chessground` 9.2.1), `tsconfig.json` (`"types": ["node", "vite/client"]`), `index.html` (add `<script type="module" src="/src/main.ts"></script>` after `<main id="app">`), `e2e/support/world.ts`
- Create: `e2e/features/opening-trainer.feature`, `e2e/steps/openingTrainer.steps.ts`
- Create: `src/ui/text.ts`, `src/ui/trainerView.ts`, `src/ui/trainer.css`, `src/main.ts`
- Test: `src/ui/text.spec.ts`, `src/ui/text.steps.ts`
- Create: `Docs/trainer-screen.md`; Modify: `Docs/index.md` (remove "We did not build it yet." from the spec link)

**Interfaces:**
- Consumes: everything from Tasks 1–6.
- Produces:

```ts
// src/ui/text.ts
export function readRating(text: string): number;      // "" or spaces give NaN
export function moveList(moves: string[]): string;     // ["e4","e5","Nf3"] gives "1. e4 e5 2. Nf3"
export function statusText(status: Status): string;    // "your move" | "checking your move" | "waiting for the reply" | "line ended"
// src/ui/trainerView.ts
export function mountTrainer(root: HTMLElement, bus: LineBus, trainer: Pick<Trainer, "start" | "yourMove">): () => void; // gives show
```

- [ ] **Step 1: Write the e2e feature**

```gherkin
Feature: Opening trainer

  Background:
    Given the explorer replies in turn:
      | e7e5 | e5  |
      | b8c6 | Nc6 |
      | a7a6 | a6  |
      | g8f6 | Nf6 |
    And the player starts a line with the rating "1450"

  Scenario: The app replies to your first move
    When the player plays "e2e4"
    Then the moves are "1. e4 e5"
    And the status is "your move"

  Scenario: The app replaces a bad move with the best move
    When the player plays "e2e4 f1a6"
    Then the message starts with "Ba6 loses"
    And the moves do not contain "Ba6"

  Scenario: The line ends after 5 of your moves
    When the player plays "e2e4 g1f3 f1b5 b5a4 e1g1"
    Then the moves are "1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O"
    And the status is "line ended"

  Scenario: Lichess does not accept the token
    Given the explorer refuses the token
    When the player plays "e2e4"
    Then the message is "Lichess did not accept the token. Make a new token at lichess.org/account/oauth/token."
    And the status is "line ended"
```

- [ ] **Step 2: Write the e2e steps and the world**

- `world.ts`: set `process.env.VITE_LICHESS_TOKEN = "e2e-token"` before `createServer`, and call `setDefaultTimeout(60_000)`. Keep `AppWorld`.
- The route `https://explorer.lichess.ovh/**` on `this.context`: answer `OPTIONS` with 204 and the headers `access-control-allow-origin: *` and `access-control-allow-headers: authorization`. Answer `GET` with JSON `{ moves: [{ uci, san, white: 1, draws: 0, black: 0 }] }` and `access-control-allow-origin: *`. The row is the fullmove number (field 6 of the `fen` parameter) of the table, counted from 1. "the explorer refuses the token" adds a later route that gives status 401. Playwright runs the newest route first.
- "the player starts a line with the rating" opens the app, fills the field with the label "Rating", and clicks "New line". "the player plays" splits its text at spaces and calls `play` for each move.
- `AppWorld.play(move)`: wait until `#status` is "Status: your move", then click the centers of the 2 squares in `cg-board`. The square size is width / 8. With White at the bottom, the center of file `f` (0–7) and rank `r` (1–8) is `x + (f + 0.5) * size`, `y + (8.5 - r) * size`.
- The other steps wait (up to 30 s) for the text of `#moves`, `#message` or `#status`. "the moves do not contain" first waits for "Status: your move".

- [ ] **Step 3: Run the e2e and make sure it fails**

Run: `npm run e2e`
Expected: 4 scenarios FAIL, because the page has no rating field.

- [ ] **Step 4: Write the failing unit tests for `src/ui/text.ts`**

```ts
test.each(["", "  "])("The empty rating %j is not a number", (text) => thenTheRatingIs(text, Number.NaN));
test("The rating 1450 is read as 1450", () => thenTheRatingIs("1450", 1450));
test("The moves get move numbers", () => thenTheMoveListIs(["e4", "e5", "Nf3"], "1. e4 e5 2. Nf3"));
test.each([
  ["yourMove", "your move"], ["checkingYourMove", "checking your move"],
  ["waitingForReply", "waiting for the reply"], ["ended", "line ended"],
])("The status %s is shown as %j", (status, text) => thenTheStatusTextIs(status as Status, text));
```

Run: `npx vitest run src/ui/text.spec.ts`. Expected: FAIL. Then implement `src/ui/text.ts`, and run again. Expected: PASS.

- [ ] **Step 5: Implement the screen**

Run `npm install --save-exact chessground@9.2.1`, then do these steps:
- `mountTrainer` adds `<label>Rating <input></label>`, a "New line" button, `<div id="board">`, `<p id="moves">`, `<p id="message">` and `<p id="status">`. It makes `Chessground(board, { orientation: "white", movable: { free: false, events: { after } } })`.
- `show` asks `CurrentLine`. It sets `fen`, `turnColor` (from field 2 of the FEN), `movable.color` (`"white"` only when the status is `yourMove`) and `movable.dests` (`legalMoves`). It calls `setAutoShapes` with the arrow (brush `"green"`) or with `[]`. It writes `moveList`, the message and `"Status: " + statusText(status)`. It disables "New line" while the status is `checkingYourMove` or `waitingForReply`.
- `after(orig, dest)`: if the piece on `dest` is a pawn on rank 8, add `q`. Then call `void trainer.yourMove(…)`.
- "New line" calls `trainer.start(readRating(input.value))`. On an error, write `error.message` in `#message`.
- `trainer.css` gives `#board` a width and a height of 400px. Import it and the 3 `chessground/assets/*.css` files in `trainerView.ts`.
- `main.ts`: make the `LineBus` and call `attachLine`. Make a `StockfishEngine` with `new Worker("/stockfish/stockfish-19-lite-single.js")`, and a `LichessExplorer` with `import.meta.env.VITE_LICHESS_TOKEN ?? ""`. Make the `Trainer` with `() => view.show()`, where `const view = { show: () => {} }`. Then set `view.show = mountTrainer(…)` and call `view.show()`.

- [ ] **Step 6: Run all the tests and make sure they pass**

Run: `npm run e2e`, `npm test` and `npm run typecheck`.
Expected: 4 scenarios pass, and all the unit tests pass. If the engine replaces one of the moves in "The line ends after 5 of your moves", stop and report the move. Do not change the scenario to make it pass.

- [ ] **Step 7: Check with the real Lichess (ask the human partner)**

The spec has a risk: we do not know if a personal token is enough. Ask your human partner to put a real token in `.env.local`, run `npm run dev`, and play one line. Expected: replies come from Lichess, and the message "Lichess did not accept the token…" does not show. Report the result. If Lichess refuses the token, stop. Do not change the design.

- [ ] **Step 8: Write `Docs/trainer-screen.md`, update `Docs/index.md`, then commit**

```bash
git add package.json package-lock.json tsconfig.json index.html src/ui src/main.ts e2e Docs/trainer-screen.md Docs/index.md
git commit -m "opening-trainer: show the trainer on a board"
```
