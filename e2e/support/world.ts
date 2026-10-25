import { After, AfterAll, Before, BeforeAll, setDefaultTimeout, setWorldConstructor, World } from "@cucumber/cucumber";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";

const WAIT = 30_000;

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

// Runs in the page. It makes the text of the move list, for example "1. e4 e5 (42%) 2. Nf3".
function shownMoves(): string {
  return [...document.querySelectorAll("#moveList .row")]
    .flatMap((row) => [
      row.querySelector(".number")?.textContent ?? "",
      ...[...row.querySelectorAll(".move")].map((move) => {
        const percent = move.querySelector(".percent")?.textContent ?? "";
        return `${move.querySelector(".san")?.textContent ?? ""}${percent === "" ? "" : ` (${percent})`}`;
      }),
    ])
    .join(" ");
}

export class AppWorld extends World {
  context!: BrowserContext;
  page!: Page;
  // The Authorization header of each explorer request, in order.
  authorizations: string[] = [];

  async openApp() {
    await this.page.goto(appUrl);
  }

  async waitForAuthorization(value: string) {
    const start = Date.now();
    while (this.authorizations.at(-1) !== value) {
      if (Date.now() - start > WAIT) {
        throw new Error(`The explorer got ${JSON.stringify(this.authorizations.at(-1))}. Wanted: "${value}".`);
      }
      await this.page.waitForTimeout(50);
    }
  }

  async play(move: string) {
    await this.waitForText("#status", "isOneOf", ["Status: your move", "Status: try again"]);
    const movesBefore = (await this.page.textContent("#moveList")) ?? "";
    const statusBefore = (await this.page.textContent("#status")) ?? "";
    const board = (await this.page.locator("cg-board").boundingBox())!;
    const size = board.width / 8;
    const black = await this.page.locator("#board.orientation-black").count() > 0;
    for (const square of [move.slice(0, 2), move.slice(2, 4)]) {
      const file = square.charCodeAt(0) - "a".charCodeAt(0);
      const rank = Number(square[1]);
      const x = black ? 7 - file + 0.5 : file + 0.5;
      const y = black ? rank - 0.5 : 8.5 - rank;
      await this.page.mouse.click(board.x + x * size, board.y + y * size);
    }
    await this.page.waitForFunction(
      (before) => document.querySelector("#moveList")?.textContent !== before.moves || document.querySelector("#status")?.textContent !== before.status,
      { moves: movesBefore, status: statusBefore },
      { timeout: WAIT },
    );
  }

  async waitForPiece(piece: string, square: string) {
    const black = await this.page.locator("#board.orientation-black").count() > 0;
    const file = square.charCodeAt(0) - "a".charCodeAt(0);
    const rank = Number(square[1]);
    const wanted = { classes: piece.split(" "), column: black ? 7 - file : file, row: black ? rank - 1 : 8 - rank };
    try {
      await this.page.waitForFunction(
        ({ classes, column, row }) => {
          const size = document.querySelector("cg-board")!.getBoundingClientRect().width / 8;
          return [...document.querySelectorAll("cg-board piece")].some((element) => {
            const found = /translate\((-?[\d.]+)px, *(-?[\d.]+)px\)/.exec((element as HTMLElement).style.transform);
            return classes.every((name) => element.classList.contains(name)) && !element.classList.contains("ghost") &&
              found !== null && Math.round(Number(found[1]) / size) === column && Math.round(Number(found[2]) / size) === row;
          });
        },
        wanted,
        { timeout: WAIT },
      );
    } catch {
      throw new Error(`The board has no ${piece} on ${square}.`);
    }
  }

  async waitForMoves(text: string) {
    try {
      await this.page.waitForFunction(`(${shownMoves})() === ${JSON.stringify(text)}`, undefined, { timeout: WAIT });
    } catch {
      throw new Error(`#moveList shows ${JSON.stringify(await this.page.evaluate(shownMoves))}. Wanted: "${text}".`);
    }
  }

  async waitForText(selector: string, match: "is" | "isOneOf", text: string | string[]) {
    try {
      await this.page.waitForFunction(
        (wanted) => {
          const shown = document.querySelector(wanted.selector)?.textContent ?? "";
          return wanted.match === "is" ? shown === wanted.text : wanted.text.includes(shown);
        },
        { selector, match, text },
        { timeout: WAIT },
      );
    } catch {
      const shown = await this.page.evaluate((wanted) => document.querySelector(wanted)?.textContent, selector);
      throw new Error(`${selector} shows ${JSON.stringify(shown)}. Wanted: ${match} "${text}".`);
    }
  }
}

setWorldConstructor(AppWorld);
setDefaultTimeout(60_000);

BeforeAll({ timeout: 60_000 }, async () => {
  server = await createServer({ server: { port: 0 }, logLevel: "silent" });
  await server.listen();
  appUrl = server.resolvedUrls!.local[0];
  browser = await chromium.launch();
});

// Each scenario starts with a saved token, except the scenarios with the tag @withoutToken.
Before(async function (this: AppWorld, { pickle }) {
  this.context = await browser.newContext();
  if (!pickle.tags.some((tag) => tag.name === "@withoutToken")) {
    await this.context.addInitScript(() => {
      if (localStorage.getItem("lichessToken") === null) localStorage.setItem("lichessToken", "e2e-token");
    });
  }
  this.page = await this.context.newPage();
});

After(async function (this: AppWorld) {
  await this.context.close();
});

AfterAll(async () => {
  await browser.close();
  await server.close();
});
