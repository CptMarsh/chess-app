import { test } from "vitest";
import {
  givenABlockedStorage, givenAStorageThatRefusesWrites, givenAStorageWith, thenTheSettingsAre, thenTheStoredSettingsAre, whenYouSave,
} from "./settings.steps.ts";

test("The stored source and username are read", () => {
  const store = givenAStorageWith({ replySource: "chessCom", chessComUsername: "Magnus" });
  thenTheSettingsAre(store, "chessCom", "Magnus");
});

test("No stored settings give Lichess and an empty username", () => {
  const store = givenAStorageWith({});
  thenTheSettingsAre(store, "lichess", "");
});

test("A wrong stored source gives Lichess", () => {
  const store = givenAStorageWith({ replySource: "fide" });
  thenTheSettingsAre(store, "lichess", "");
});

test("A blocked storage gives Lichess and an empty username", () => {
  const store = givenABlockedStorage();
  thenTheSettingsAre(store, "lichess", "");
});

test("Saved settings lose the spaces of the username and are written", () => {
  const store = givenAStorageWith({});
  whenYouSave(store, "chessCom", "  Magnus \n");
  thenTheSettingsAre(store, "chessCom", "Magnus");
  thenTheStoredSettingsAre(store, "chessCom", "Magnus");
});

test("A refused write keeps the settings in memory", () => {
  const store = givenAStorageThatRefusesWrites();
  whenYouSave(store, "chessCom", "Magnus");
  thenTheSettingsAre(store, "chessCom", "Magnus");
});

test("A blocked storage keeps saved settings in memory", () => {
  const store = givenABlockedStorage();
  whenYouSave(store, "chessCom", "Magnus");
  thenTheSettingsAre(store, "chessCom", "Magnus");
});
