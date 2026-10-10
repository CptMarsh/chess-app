import { Given, Then, When } from "@cucumber/cucumber";
import type { BookWorld } from "../support/world.ts";

Given("the app has no book", async function (this: BookWorld) {
  await this.openApp();
});

Given("the player saved {string}", async function (this: BookWorld, pgn: string) {
  await this.openApp();
  await this.save(pgn);
});

When("the player pastes {string} and saves", async function (this: BookWorld, pgn: string) {
  await this.save(pgn);
});

When("the player saves {string} and reloads the page", async function (this: BookWorld, pgn: string) {
  await this.save(pgn);
  await this.page.reload();
});

Then("the page shows {string}", async function (this: BookWorld, text: string) {
  await this.page.getByText(text, { exact: true }).waitFor({ timeout: 3_000 });
});
