import { test } from "vitest";
import {
  givenABlockedStorage, givenAStorageThatRefusesWrites, givenAStorageWith, thenTheSettingsAre, thenTheStoredTextIs, whenYouSave,
} from "./settings.steps.ts";

const SETTINGS = { rating: "1450", color: "black", moves: "5" } as const;

test("No stored settings give null", () => {
  const store = givenAStorageWith(null);
  thenTheSettingsAre(store, null);
});

test("Stored settings are read", () => {
  const store = givenAStorageWith(JSON.stringify(SETTINGS));
  thenTheSettingsAre(store, SETTINGS);
});

test.each(["not json", "null", "[]", '{"rating":"1450"}', '{"rating":"1450","color":"red","moves":"5"}', '{"rating":1450,"color":"white","moves":"5"}'])(
  "The bad text %j gives null",
  (text) => {
    const store = givenAStorageWith(text);
    thenTheSettingsAre(store, null);
  },
);

test("A blocked storage gives null", () => {
  const store = givenABlockedStorage();
  thenTheSettingsAre(store, null);
});

test("Saved settings are written", () => {
  const store = givenAStorageWith(null);
  whenYouSave(store, SETTINGS);
  thenTheSettingsAre(store, SETTINGS);
  thenTheStoredTextIs(store, JSON.stringify(SETTINGS));
});

test("A refused write keeps the settings in memory", () => {
  const store = givenAStorageThatRefusesWrites();
  whenYouSave(store, SETTINGS);
  thenTheSettingsAre(store, SETTINGS);
});

test("A blocked storage keeps saved settings in memory", () => {
  const store = givenABlockedStorage();
  whenYouSave(store, SETTINGS);
  thenTheSettingsAre(store, SETTINGS);
});
