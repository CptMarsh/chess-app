import { test } from "vitest";
import {
  givenABlockedStorage, givenAStorageThatRefusesWrites, givenAStorageWith, thenSavingThrows, thenTheStoredTokenIs, thenTheTokenIs, whenYouSave,
} from "./token.steps.ts";

test("A stored token is read", () => {
  const store = givenAStorageWith("my-token");
  thenTheTokenIs(store, "my-token");
});

test("No stored token gives an empty token", () => {
  const store = givenAStorageWith(null);
  thenTheTokenIs(store, "");
});

test("A blocked storage gives an empty token", () => {
  const store = givenABlockedStorage();
  thenTheTokenIs(store, "");
});

test("A saved token loses its spaces and is written", () => {
  const store = givenAStorageWith(null);
  whenYouSave(store, "  new-token \n");
  thenTheTokenIs(store, "new-token");
  thenTheStoredTokenIs(store, "new-token");
});

test.each(["", "   "])("The empty token %j is not saved", (text) => {
  const store = givenAStorageWith("old-token");
  thenSavingThrows(store, text, "Paste your Lichess token.");
  thenTheTokenIs(store, "old-token");
  thenTheStoredTokenIs(store, "old-token");
});

test("A refused write keeps the token in memory", () => {
  const store = givenAStorageThatRefusesWrites();
  whenYouSave(store, "new-token");
  thenTheTokenIs(store, "new-token");
});

test("A blocked storage keeps a saved token in memory", () => {
  const store = givenABlockedStorage();
  whenYouSave(store, "new-token");
  thenTheTokenIs(store, "new-token");
});
