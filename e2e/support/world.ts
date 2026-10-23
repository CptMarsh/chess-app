import { After, AfterAll, Before, BeforeAll, setDefaultTimeout, setWorldConstructor, World } from "@cucumber/cucumber";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";

const WAIT = 30_000;

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

export class AppWorld extends World {
  context!: BrowserContext;
  page!: Page;

  async openApp() {
    await this.page.goto(appUrl);
  }

  async play(move: string) {
    await this.waitForText("#status", "is", "Status: your move");
    const movesBefore = (await this.page.textContent("#moves")) ?? "";
    const board = (await this.page.locator("cg-board").boundingBox())!;
    const size = board.width / 8;
    for (const square of [move.slice(0, 2), move.slice(2, 4)]) {
      const file = square.charCodeAt(0) - "a".charCodeAt(0);
      const rank = Number(square[1]);
      await this.page.mouse.click(board.x + (file + 0.5) * size, board.y + (8.5 - rank) * size);
    }
    await this.waitForText("#moves", "isNot", movesBefore);
  }

  async waitForText(selector: string, match: "is" | "isNot" | "startsWith", text: string) {
    try {
      await this.page.waitForFunction(
        (wanted) => {
          const shown = document.querySelector(wanted.selector)?.textContent ?? "";
          const matches = { is: shown === wanted.text, isNot: shown !== wanted.text, startsWith: shown.startsWith(wanted.text) };
          return matches[wanted.match];
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
  process.env.VITE_LICHESS_TOKEN = "e2e-token";
  server = await createServer({ server: { port: 0 }, logLevel: "silent" });
  await server.listen();
  appUrl = server.resolvedUrls!.local[0];
  browser = await chromium.launch();
});

Before(async function (this: AppWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: AppWorld) {
  await this.context.close();
});

AfterAll(async () => {
  await browser.close();
  await server.close();
});
