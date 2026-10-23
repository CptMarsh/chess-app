import assert from "node:assert/strict";
import { Given, Then, When, type DataTable } from "@cucumber/cucumber";
import type { AppWorld } from "../support/world.ts";

const EXPLORER = "https://explorer.lichess.ovh/**";
const ANY_ORIGIN = { "access-control-allow-origin": "*" };

Given("the explorer replies in turn:", async function (this: AppWorld, table: DataTable) {
  const rows = table.raw();
  await this.context.route(EXPLORER, (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { ...ANY_ORIGIN, "access-control-allow-headers": "authorization" } });
    }
    const fullmove = Number(new URL(request.url()).searchParams.get("fen")!.split(" ")[5]);
    const [uci, san] = rows[fullmove - 1];
    return route.fulfill({ headers: ANY_ORIGIN, json: { moves: [{ uci, san, white: 1, draws: 0, black: 0 }] } });
  });
});

Given("the explorer refuses the token", async function (this: AppWorld) {
  await this.context.route(EXPLORER, (route) =>
    route.request().method() === "OPTIONS" ? route.fallback() : route.fulfill({ status: 401, headers: ANY_ORIGIN }),
  );
});

Given("the player starts a line with the rating {string}", async function (this: AppWorld, rating: string) {
  await this.openApp();
  await this.page.getByLabel("Rating").fill(rating);
  await this.page.getByRole("button", { name: "New line" }).click();
});

When("the player plays {string}", async function (this: AppWorld, moves: string) {
  for (const move of moves.split(" ")) {
    await this.play(move);
  }
});

Then("the moves are {string}", async function (this: AppWorld, moves: string) {
  await this.waitForText("#moves", "is", moves);
});

Then("the moves do not contain {string}", async function (this: AppWorld, move: string) {
  await this.waitForText("#status", "is", "Status: your move");
  const shown = (await this.page.textContent("#moves")) ?? "";
  assert.ok(!shown.includes(move), `#moves shows "${shown}".`);
});

Then("the status is {string}", async function (this: AppWorld, status: string) {
  await this.waitForText("#status", "is", `Status: ${status}`);
});

Then("the message is {string}", async function (this: AppWorld, message: string) {
  await this.waitForText("#message", "is", message);
});

Then("the message starts with {string}", async function (this: AppWorld, start: string) {
  await this.waitForText("#message", "startsWith", start);
});
