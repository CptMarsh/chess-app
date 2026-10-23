import { After, AfterAll, Before, BeforeAll, setWorldConstructor, World } from "@cucumber/cucumber";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { createServer, type ViteDevServer } from "vite";

let server: ViteDevServer;
let browser: Browser;
let appUrl: string;

export class AppWorld extends World {
  context!: BrowserContext;
  page!: Page;

  async openApp() {
    await this.page.goto(appUrl);
  }
}

setWorldConstructor(AppWorld);

BeforeAll({ timeout: 60_000 }, async () => {
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
