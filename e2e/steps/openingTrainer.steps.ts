import assert from "node:assert/strict";
import { Given, Then, When, type DataTable } from "@cucumber/cucumber";
import type { AppWorld } from "../support/world.ts";

const EXPLORER = "https://explorer.lichess.ovh/**";
const ANY_ORIGIN = { "access-control-allow-origin": "*" };

Given("the explorer replies in turn:", async function (this: AppWorld, table: DataTable) {
  const rows = table.raw();
  await this.context.unroute(EXPLORER);
  await this.context.route(EXPLORER, (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") {
      return route.fulfill({ status: 204, headers: { ...ANY_ORIGIN, "access-control-allow-headers": "authorization" } });
    }
    this.authorizations.push(request.headers().authorization ?? "");
    const fullmove = Number(new URL(request.url()).searchParams.get("fen")!.split(" ")[5]);
    const [uci, san, percent] = rows[fullmove - 1];
    return route.fulfill({ headers: ANY_ORIGIN, json: { white: 100, draws: 0, black: 0, moves: [{ uci, san, white: Number(percent), draws: 0, black: 0 }] } });
  });
});

Given("the explorer refuses the token", async function (this: AppWorld) {
  await this.context.route(EXPLORER, (route) =>
    route.request().method() === "OPTIONS" ? route.fallback() : route.fulfill({ status: 401, headers: ANY_ORIGIN }),
  );
});

Given("the player opens the app", async function (this: AppWorld) {
  await this.openApp();
});

When("the player reloads the app", async function (this: AppWorld) {
  await this.page.reload();
});

When("the player saves the token {string}", async function (this: AppWorld, token: string) {
  await this.page.getByLabel("Lichess token").fill(token);
  await this.page.getByRole("button", { name: "Save" }).click();
});

Then("the token dialog is open", async function (this: AppWorld) {
  await this.page.waitForSelector("#tokenDialog[open]", { timeout: 30_000 });
});

Then("the token dialog is closed", async function (this: AppWorld) {
  await this.page.waitForSelector("#tokenDialog:not([open])", { state: "attached", timeout: 30_000 });
});

Then("the token dialog has no Cancel button", async function (this: AppWorld) {
  assert.equal(await this.page.locator("#tokenDialog").getByRole("button", { name: "Cancel" }).count(), 0);
});

Then("the token message is {string}", async function (this: AppWorld, message: string) {
  await this.waitForText("#tokenError", "is", message);
});

Then("the explorer got the token {string}", async function (this: AppWorld, token: string) {
  await this.waitForAuthorization(`Bearer ${token}`);
});

Given("the player chooses the color {string}", async function (this: AppWorld, label: string) {
  await this.openSettings();
  await this.page.getByLabel("Color").selectOption({ label });
});

Given("the player chooses {int} moves", async function (this: AppWorld, moves: number) {
  await this.openSettings();
  await this.page.getByLabel("Moves").fill(String(moves));
});

Given("the player starts a line with the rating {string}", async function (this: AppWorld, rating: string) {
  await this.openSettings();
  await this.page.getByLabel("Rating").fill(rating);
  await this.page.getByRole("button", { name: "New line" }).click();
});

When("the player plays {string}", async function (this: AppWorld, moves: string) {
  for (const move of moves.split(" ")) {
    await this.play(move);
  }
});

When("the player presses {string}", async function (this: AppWorld, key: string) {
  await this.page.keyboard.press(key);
});

When("the player presses {string} in the {string} field", async function (this: AppWorld, key: string, field: string) {
  await this.openSettings();
  await this.page.getByLabel(field).press(key);
});

When("the player clicks the move {string}", async function (this: AppWorld, move: string) {
  await this.page.locator("#moveList .move").filter({ has: this.page.locator(".san", { hasText: new RegExp(`^${move}$`) }) }).click();
});

When("the player right-clicks the move {string}", async function (this: AppWorld, move: string) {
  await this.page.locator("#moveList .move").filter({ has: this.page.locator(".san", { hasText: new RegExp(`^${move}$`) }) }).click({ button: "right" });
});

When("the player clicks {string}", async function (this: AppWorld, name: string) {
  await this.page.getByRole("button", { name }).click();
});

When("the player clicks the cog", async function (this: AppWorld) {
  await this.page.getByRole("button", { name: "Settings" }).click();
});

Then("the settings are open", async function (this: AppWorld) {
  assert.ok(await this.settingsAreOpen(), "The settings are closed.");
});

Then("the settings are closed", async function (this: AppWorld) {
  assert.ok(!(await this.settingsAreOpen()), "The settings are open.");
});

Then("the highlighted move is {string}", async function (this: AppWorld, move: string) {
  await this.waitForText("#moveList .viewed .san", "is", move);
});

Then("the board has a {string} on {string}", async function (this: AppWorld, piece: string, square: string) {
  await this.waitForPiece(piece, square);
});

Then("the Moves field shows {string}", async function (this: AppWorld, moves: string) {
  await this.openSettings();
  assert.equal(await this.page.getByLabel("Moves").inputValue(), moves);
});

Then("the moves are {string}", async function (this: AppWorld, moves: string) {
  await this.waitForMoves(moves);
});

Then("the board shows the Black side", async function (this: AppWorld) {
  await this.page.waitForSelector("#board.orientation-black", { timeout: 30_000 });
});

Then("the eval bar shows a number", async function (this: AppWorld) {
  await this.page.waitForFunction(() => /^(\d+\.\d|M)$/.test(document.querySelector("#evalBarText")?.textContent ?? ""), undefined, { timeout: 30_000 });
});

Then("the eval bar shows no number", async function (this: AppWorld) {
  await this.waitForText("#evalBarText", "is", "");
});

Then("the eval bar has a height", async function (this: AppWorld) {
  const height = await this.page.evaluate(() => document.querySelector<HTMLElement>("#evalBarWhite")!.style.height);
  assert.match(height, /^\d+(\.\d+)?%$/);
});

Then("the page background is {string}", async function (this: AppWorld, color: string) {
  assert.equal(await this.page.evaluate(() => getComputedStyle(document.body).backgroundColor), color);
});

Then("the font {string} is loaded", async function (this: AppWorld, family: string) {
  const loaded = await this.page.evaluate(async (wanted) => {
    await document.fonts.ready;
    return [...document.fonts].some((font) => font.family.replaceAll('"', "") === wanted && font.status === "loaded");
  }, family);
  assert.ok(loaded, `The font ${family} is not loaded.`);
});

Then("the accuracy is {string}", async function (this: AppWorld, accuracy: string) {
  await this.waitForText("#accuracy", "is", `Accuracy: ${accuracy}`);
});

Then("the status is {string}", async function (this: AppWorld, status: string) {
  await this.waitForText("#status", "is", `Status: ${status}`);
});

Then("the message is {string}", async function (this: AppWorld, message: string) {
  await this.waitForText("#message", "is", message);
});

Given("the screen is {int} by {int} pixels", async function (this: AppWorld, width: number, height: number) {
  await this.page.setViewportSize({ width, height });
});

Then("the move list is under the board", async function (this: AppWorld) {
  const board = (await this.page.locator("#board").boundingBox())!;
  const moveList = (await this.page.locator("#moveList").boundingBox())!;
  assert.ok(moveList.y >= board.y + board.height, `The move list starts at ${moveList.y}. The board ends at ${board.y + board.height}.`);
});

Then("the page does not scroll sideways", async function (this: AppWorld) {
  const widths = await this.page.evaluate(() => ({ page: document.documentElement.scrollWidth, screen: document.documentElement.clientWidth }));
  assert.ok(widths.page <= widths.screen, `The page is ${widths.page} pixels wide. The screen is ${widths.screen} pixels wide.`);
});

Then("the clipboard has {string}", async function (this: AppWorld, text: string) {
  assert.equal(await this.page.evaluate(() => navigator.clipboard.readText()), text);
});

Then("the Copy PGN button shows {string}", async function (this: AppWorld, text: string) {
  await this.waitForText("#copyPgn", "is", text);
});

Then("the engine shows {int} lines from {string}", async function (this: AppWorld, count: number, start: string) {
  await this.page.locator("#engineLines .engineLine").nth(count - 1).waitFor({ timeout: 30_000 });
  const lines = await this.page.locator("#engineLines .engineLine").evaluateAll((elements) => elements.map((element) => ({
    score: element.querySelector(".score")?.textContent ?? "",
    moves: element.querySelector(".moves")?.textContent ?? "",
  })));
  assert.equal(lines.length, count);
  for (const { score, moves } of lines) {
    assert.match(score, /^([+-](\d+\.\d|M)|0\.0)$/);
    assert.ok(moves.startsWith(start), `The engine line "${moves}" does not start with "${start}".`);
  }
});

Then("the engine lines are hidden", async function (this: AppWorld) {
  await this.page.locator("#engineLines").waitFor({ state: "hidden", timeout: 30_000 });
});
