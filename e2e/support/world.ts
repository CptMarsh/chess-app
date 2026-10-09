import { After, AfterAll, Before, BeforeAll, setWorldConstructor, World } from "@cucumber/cucumber";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

export class BookWorld extends World {
  context!: BrowserContext;
  page!: Page;

  async openApp() {
    await this.page.goto(appUrl);
  }

  async save(pgn: string) {
    await this.page.getByRole("textbox").fill(pgn);
    await this.page.getByRole("button", { name: "Save" }).click();
  }
}

setWorldConstructor(BookWorld);

BeforeAll({ timeout: 60_000 }, async () => {
  server = await createServer({ server: { port: 0 }, logLevel: "silent" });
  await server.listen();
  appUrl = server.resolvedUrls!.local[0];
  browser = await chromium.launch();
});

Before(async function (this: BookWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});

After(async function (this: BookWorld) {
  await this.context.close();
});

AfterAll(async () => {
  await browser.close();
  await server.close();
});
